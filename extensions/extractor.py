"""Fetch a URL and extract clean text, outputting JSON to stdout.

Usage: python3 extractor.py <url> <timeout_sec> <max_output_chars>
"""

import sys
import html.parser
import urllib.request
import json


class DocExtractor(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = []
        self.skip_tags = {'script', 'style', 'nav', 'footer', 'header', 'noscript', 'svg', 'head'}
        self.skip_depth = 0
        self.text_buffer = []
        self.in_code = False
        self.in_pre = False
        self.li_depth = 0
        self.heading_level = 0

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        if tag_lower in self.skip_tags:
            self.skip_depth += 1
        if tag_lower == 'code':
            self.in_code = True
        if tag_lower == 'pre':
            self.in_pre = True
        if tag_lower == 'li':
            self.li_depth += 1
        if tag_lower in ('h1','h2','h3','h4','h5','h6'):
            self.heading_level = int(tag_lower[1])
            self._flush_text()
        if tag_lower == 'br':
            self._flush_text()
            self.result.append('')
        if tag_lower in ('p','div','section','ul','ol','dl','table','blockquote','hr'):
            self._flush_text()

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in self.skip_tags:
            self.skip_depth = max(0, self.skip_depth - 1)
        if tag_lower == 'code':
            self.in_code = False
        if tag_lower == 'pre':
            self.in_pre = False
            self._flush_text()
        if tag_lower == 'li':
            self.li_depth = max(0, self.li_depth - 1)
            self._flush_text()
        if tag_lower in ('p','div','section','ul','ol','dl','table','blockquote'):
            self._flush_text()
        if tag_lower in ('h1','h2','h3','h4','h5','h6'):
            self._flush_text()

    def handle_data(self, data):
        if self.skip_depth > 0:
            return
        text = data.strip()
        if text:
            self.text_buffer.append(text)

    def _flush_text(self):
        if self.text_buffer:
            line = ' '.join(self.text_buffer)
            self.text_buffer = []
            if self.in_pre:
                self.result.append(line)
            elif self.in_code:
                self.result.append('\x60' + line + '\x60')
            elif self.heading_level > 0:
                prefix = '#' * self.heading_level
                self.result.append('')
                self.result.append(prefix + ' ' + line)
                self.result.append('')
                self.heading_level = 0
            elif self.li_depth > 0:
                indent = '  ' * (self.li_depth - 1)
                self.result.append(indent + '- ' + line)
            else:
                self.result.append(line)

    def get_text(self):
        self._flush_text()
        cleaned = []
        empty_count = 0
        for line in self.result:
            if not line.strip():
                empty_count += 1
                if empty_count <= 2:
                    cleaned.append('')
            else:
                empty_count = 0
                cleaned.append(line)
        return '\n'.join(cleaned).strip()


def main():
    if len(sys.argv) < 4:
        print(json.dumps({"ok": False, "error": "Usage: extractor.py <url> <timeout_sec> <max_output_chars>"}))
        sys.exit(1)

    url = sys.argv[1]
    timeout = int(sys.argv[2])
    max_chars = int(sys.argv[3])

    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (compatible; PiFetchDocs/1.0)'},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode('utf-8', errors='replace')

        extractor = DocExtractor()
        extractor.feed(html)
        text = extractor.get_text()

        if len(text) > max_chars:
            text = text[:max_chars] + '\n\n... (truncated)'

        print(json.dumps({"ok": True, "url": url, "text": text}))
    except Exception as e:
        print(json.dumps({"ok": False, "url": url, "error": str(e)}))


if __name__ == '__main__':
    main()

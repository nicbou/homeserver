from datetime import datetime
from hashlib import md5
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse, quote_plus, unquote
import csv
import json
import logging
import re


logger = logging.getLogger(__name__)


def json_format(input):
    try:
        output = json.dumps(json.loads(input), indent=4, sort_keys=True)
        return f"<pre>{output}</pre>"
    except json.decoder.JSONDecodeError as e:
        return f"Invalid JSON: {e.msg}"


default = 'https://www.google.com/search?q={query}'

search_engines = {
    '*': 'https://www.google.com/search?btnI=I\'m+Feeling+Lucky&q={query}',
    'archive': 'https://web.archive.org/web/20300101000000/{query_raw}',
    'aufenthg': 'https://www.gesetze-im-internet.de/aufenthg_2004/__{query}.html',
    'aufenthv': 'https://www.gesetze-im-internet.de/aufenthv/__41.html',
    'bing': 'https://www.bing.com/search?q={query}',
    'bingi': 'https://www.bing.com/images/search?q={query}',
    'bingv': 'https://www.bing.com/videos/search?q={query}',
    'bro': 'https://bropages.org/{query}',
    'collins': 'https://www.collinsdictionary.com/us/dictionary/english/{query}',
    'commons': 'https://commons.wikimedia.org/w/index.php?title=Special:Search&search={query}',
    'dict': 'https://www.google.com/search?q=dictionary#dobs={query}',
    'de': 'https://www.dict.cc/?s={query}',
    'deepl': 'https://www.deepl.com/translator#de/en/{query_raw}',
    'g': 'https://allaboutberlin.com/glossary/{query}',
    'gmail': 'https://mail.google.com/mail/u/0/#search/{query}',
    'gmaps': 'https://maps.google.com/maps?q={query}',
    'gpt': 'https://chat.openai.com/?q={query}',
    'i': 'https://www.google.com/search?tbm=isch&q={query}',
    'images': 'https://www.google.com/search?tbm=isch&q={query}',
    'imdb': 'https://www.imdb.com/find?q={query}',
    'm': 'https://maps.google.com/maps?q={query}',
    'pip': 'https://pypi.org/search/?q={query}',
    'pypi': 'https://pypi.org/search/?q={query}',
    't': 'https://twitter.com/search?q={query}',
    'time': 'https://time.lol/#{query}',
    'thes': 'https://www.thesaurus.com/browse/{query}',
    'twitter': 'https://twitter.com/search?q={query}',
    'udict': 'https://www.urbandictionary.com/define.php?term={query}',
    'v': 'https://www.google.com/search?tbm=vid&q={query}',
    'videos': 'https://www.google.com/search?tbm=vid&q={query}',
    'whois': 'https://who.is/whois/{query}',
    'youtube': 'https://www.youtube.com/results?search_query={query}',
    'yt': 'https://www.youtube.com/results?search_query={query}',
}

commands = (
    # "en2fr" translation
    (r'^([a-z]{2})2([a-z]{2})$', 'https://translate.google.com/translate_t?sl={0}&tl={1}&text={2}'),

    # "wen" wikipedia
    (r'^w([a-z]{2})$', 'https://www.wikipedia.org/search-redirect.php?language={0}&search={1}'),
)

functions = {
    'urlencode': lambda input, req_handler: quote_plus(input),
    'urldecode': lambda input, req_handler: unquote(input),
    'json': lambda input, req_handler: json_format(input),
    'md5': lambda input, req_handler: md5(input.encode()).hexdigest(),
    'ip': lambda input, req_handler: req_handler.headers.get('X-Forwarded-For', req_handler.client_address[0]),
}


class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        querystring = parse_qs(urlparse(self.path).query)
        query = querystring.get('q', [''])[0]
        is_private = querystring.get('private', [''])[0] == '1'  # Legacy mode that disabled logging in Incognito mode
        url = default.format(query=quote_plus(query))

        if not query:
            self.return_text("""
                <form method="GET" action="/search">
                    <input type="search" name="q" placeholder="Query"/>
                </form>
            """)
            return

        if ':' not in query:
            self.redirect(url, query=query, private=is_private)
            return

        keyword, subquery_raw = query.split(':', 1)

        if keyword in functions:
            self.return_text(functions[keyword](subquery_raw, self))
            return

        subquery = quote_plus(subquery_raw)
        if keyword in search_engines:
            url = search_engines[keyword].format(
                query=subquery,
                query_raw=subquery_raw
            )
        else:
            for regex, command in commands:
                matches = re.match(regex, keyword)
                if matches:
                    url = command.format(*(matches.groups() + (subquery,)))

        self.redirect(url, query=query, private=is_private)

    def log_message(self, format, *args):
        return

    def log_search(self, date, url, query):
        log_file = Path('/var/log/search') / f'{date.astimezone().strftime("%Y-%m-%d")}.searches.csv'

        file_exists = log_file.exists()
        with log_file.open('a', newline='') as csvfile:
            line = {
                'date': date.astimezone().isoformat(),
                'url': url,
                'query': query,
            }
            writer = csv.DictWriter(csvfile, line.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(line)

    def redirect(self, url, query, private=True):
        if not private:
            self.log_search(datetime.now(), url, query)

        self.send_response(302)
        self.send_header('Location', url)
        self.end_headers()

    def return_text(self, text):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=UTF-8')
        self.end_headers()
        wrapper = """
        <!DOCTYPE html>
        <html>
        <head>
            <style type="text/css">
                html{{width:100%;height:100%;background:#eee;}}
                body{{margin:30px auto;max-width:800px;padding:30px;background:#fff;font-family:monospace;}}
            </style>
        </head>
        <body>
            {}
        </body>
        </html>
        """
        self.wfile.write(bytes(wrapper.format(text), 'UTF-8'))


httpd = HTTPServer(('0.0.0.0', 80), SimpleHTTPRequestHandler)
httpd.serve_forever()

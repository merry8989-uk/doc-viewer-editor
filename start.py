#!/usr/bin/env python3
"""
DocForge local launcher.

Starts a tiny local web server for the DocForge folder and opens it in your
browser. Everything runs on your machine; nothing is uploaded anywhere.
No third-party packages required - just Python 3.

Usage:  python3 start.py            (or double-click start.bat / start.sh)
        PORT=9000 python3 start.py  (pick a different port)
"""
import http.server
import socketserver
import functools
import mimetypes
import os
import sys
import threading
import webbrowser

PORT = int(os.environ.get("PORT", "8765"))
HERE = os.path.dirname(os.path.abspath(__file__))

# make sure the web-app file types are served with the right MIME types
mimetypes.add_type("application/manifest+json", ".webmanifest")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("image/svg+xml", ".svg")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HERE, **kwargs)

    def end_headers(self):
        # keep the service worker fresh and allow camera (secure-context-ish localhost)
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Service-Worker-Allowed", "/")
        super().end_headers()

    def log_message(self, *args):
        pass  # quiet


def main():
    os.chdir(HERE)
    try:
        httpd = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler)
    except OSError:
        print("Port %d is busy - trying %d" % (PORT, PORT + 1))
        httpd = socketserver.ThreadingTCPServer(("127.0.0.1", PORT + 1), Handler)
    url = "http://127.0.0.1:%d/" % httpd.server_address[1]
    print("DocForge is running at %s" % url)
    print("Press Ctrl+C to stop.")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()

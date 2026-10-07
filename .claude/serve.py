# 미리보기용 로컬 서버: 수정한 내용이 새로고침 때 바로 보이도록 캐시를 끔
import http.server
import os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


http.server.ThreadingHTTPServer(("127.0.0.1", 5500), NoCacheHandler).serve_forever()

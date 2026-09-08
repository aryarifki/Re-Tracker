import requests
import time
import base64
import json
from typing import Optional, Any

class BaseClient:
    BASE_URL = "https://www.idx.co.id"
    
    def __init__(self):
        self.session = requests.Session()
        self._session_ready = False
        self.headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
            'Referer': 'https://www.idx.co.id/',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
        }

    def _ensure_session(self):
        if self._session_ready:
            return
        try:
            self.session.get(f"{self.BASE_URL}/id", headers=self.headers, timeout=15)
            time.sleep(1)
            self.headers['X-Requested-With'] = 'XMLHttpRequest'
            self.session.get(f"{self.BASE_URL}/primary/home/GetIndexList", headers=self.headers, timeout=15)
            time.sleep(1)
            self._session_ready = True
        except Exception as e:
            raise Exception(f"Gagal inisialisasi sesi IDX: {e}")

    def _fetch(self, endpoint: str, params: dict = None, max_retries: int = 3) -> Optional[Any]:
        self._ensure_session()
        url = f"{self.BASE_URL}{endpoint}"
        for attempt in range(max_retries):
            try:
                resp = self.session.get(url, headers=self.headers, params=params, timeout=15)
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                if attempt >= max_retries - 1:
                    return None
                time.sleep(min(1000 * (2 ** attempt) / 1000, 15))

class CompanyModule:
    def __init__(self, client: BaseClient):
        self.client = client

    def getCompanyProfiles(self, start=0, length=9999):
        params = {"start": start, "length": length}
        data = self.client._fetch("/primary/ListedCompany/GetCompanyProfiles", params)
        return data.get("data", []) if data and data.get("data") else []

class IDXClient(BaseClient):
    def __init__(self):
        super().__init__()
        self.company = CompanyModule(self)

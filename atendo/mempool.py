from datetime import datetime
from decimal import Decimal
import json
import logging
import re
import requests

class MemPool(object):
    timeout = 20
    _clean = re.compile(r'"tx_blob"\s*:\s*"(\\.|[^"\\]+)*"\s*,')

    def __init__(self, host, port=18081, timeout=None):
        self.url = 'http://{host}:{port}/get_transaction_pool'.format(host=host, port=port)
        self.timeout = self.timeout or timeout
        self._log = logging.getLogger(__name__)

    def refresh(self):
        req = requests.post(
            self.url, headers={'Content-Type': 'application/json'}, timeout=self.timeout)
        cleantext = self._clean.sub('', req.text)
        self._raw_data = json.loads(cleantext)
        try:
            return self._process()
        except Exception:
            self._log.exception("Error while processing data")
            self._log.debug(str(self._raw_data))
            raise

    def _process(self):
        txs = []
        for tx in self._raw_data.get('transactions', []):
            tx = tx.copy()
            tx['tx_json'] = json.loads(tx['tx_json'])
            txs.append({
                'received': datetime.fromtimestamp(tx['receive_time']),
                'size': tx['blob_size'],
                'fee': tx['fee'] / Decimal('1000000000000'),
                'inputs': len(tx['tx_json']['vin']),
                'outputs': len(tx['tx_json']['vout']),
                'ring': len(tx['tx_json']['vin'][0]['key']['key_offsets']),
                'version': tx['tx_json']['version'],
                'hash_id': tx['id_hash']})
        return txs

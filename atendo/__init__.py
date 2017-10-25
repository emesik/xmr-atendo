from datetime import datetime
from .mempool import MemPool
from .txndb import mksession, Txn, TxnSum

class Atendo(object):
    def __init__(self, daemon_host='127.0.0.1', daemon_port=18081, db_url='sqlite://atendo.db'):
        self.mempool = MemPool(host=daemon_host, port=daemon_port)
        self.dbsession = mksession(db_url)

    def fetch(self):
        now = datetime.utcnow()
        sums = {
            'fee': 0,
            'size': 0
        }
        for txdata in self.mempool.refresh():
            sums['fee'] += txdata['fee']
            sums['size'] += txdata['size']
            txn = Txn(queried=now, **txdata)
            txnsum = TxnSum(queried=now, **sums)
            self.dbsession.add(txn)
        self.dbsession.add(txnsum)
        self.dbsession.commit()

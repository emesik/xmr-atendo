from datetime import datetime
from .mempool import MemPool
from .txndb import mksession, Txn

class Atendo(object):
    def __init__(self, daemon_host='127.0.0.1', daemon_port=18081, db_url='sqlite://atendo.db'):
        self.mempool = MemPool(host=daemon_host, port=daemon_port)
        self.dbsession = mksession(db_url)

    def fetch(self):
        now = datetime.utcnow()
        for txdata in self.mempool.refresh():
            txn = Txn(queried=now, **txdata)
            self.dbsession.add(txn)
        self.dbsession.commit()

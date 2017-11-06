from datetime import datetime
from decimal import Decimal, getcontext
from .mempool import MemPool
from .txndb import mksession, Txn, TxnStat

PICONERO = Decimal('0.000000000001')

class Atendo(object):
    def __init__(self, daemon_host='127.0.0.1', daemon_port=18081, db_url='sqlite://atendo.db'):
        self.mempool = MemPool(host=daemon_host, port=daemon_port)
        self.dbsession = mksession(db_url)

    def fetch(self):
        now = datetime.utcnow()
        stat = {
            'txns': 0,
            'sumfee': 0,
            'sumsize': 0
        }
        feesperkb = []
        maxage = Decimal('-Infinity')
        for txdata in self.mempool.refresh():
            stat['txns'] += 1
            stat['sumfee'] += txdata['fee']
            stat['sumsize'] += txdata['size']
            maxage = max(maxage, (now - txdata['received']).total_seconds())
            feesperkb.append(txdata['fee'] / (txdata['size'] / Decimal(1024)))
            if self.dbsession.query(Txn).filter(Txn.hash_id == txdata['hash_id']).count() == 0:
                txn = Txn(queried=now, **txdata)
                self.dbsession.add(txn)
        if stat['txns'] > 0:
            stat['avgfee'] = (stat['sumfee'] / stat['txns']).quantize(PICONERO)
            stat['avgsize'] = int(stat['sumsize'] / stat['txns'])
            stat['avgfeeperkb'] = (sum(feesperkb) / len(feesperkb)).quantize(PICONERO)
        else:
            stat['avgfee'] = stat['avgfeeperkb'] = None
            stat['avgsize'] = 0
        stat['maxage'] = maxage
        txnstat = TxnStat(queried=now, **stat)
        self.dbsession.add(txnstat)
        self.dbsession.commit()

#!/usr/bin/python
import json
import sys
from sqlalchemy.sql import func
from atendo.txndb import Txn, TxnSum, mksession

try:
    config = json.loads(open(sys.argv[1], 'r').read())
except Exception:
    print("Usage: {0} <config.json>".format(*sys.argv), file=sys.stderr)
    raise

s = mksession(config['db_url'])
for (timestamp,) in s.query(Txn.queried).distinct().all():
    if s.query(TxnSum).filter(TxnSum.queried == timestamp).count() == 0:
        sums = s.query(
            func.sum(Txn.fee).label('fee'),
            func.sum(Txn.size).label('size')
            ).filter(Txn.queried == timestamp)
        txnsum = TxnSum(queried=timestamp, **sums.one()._asdict())
        s.add(txnsum)
s.commit()

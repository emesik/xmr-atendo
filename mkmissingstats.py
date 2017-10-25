#!/usr/bin/python
from decimal import Decimal
import json
import sys
from sqlalchemy.sql import func
from atendo import PICONERO
from atendo.txndb import Txn, TxnStat, mksession
from atendo.utils import get_config_or_usage

config = get_config_or_usage()

s = mksession(config['db_url'])
for (timestamp,) in s.query(Txn.queried).distinct().all():
    if s.query(TxnStat).filter(TxnStat.queried == timestamp).count() == 0:
        sums = s.query(
            func.sum(Txn.fee).label('sumfee'),
            func.sum(Txn.size).label('sumsize'),
            func.avg(Txn.fee).label('avgfee'),
            func.avg(Txn.size).label('avgsize'),
            ).filter(Txn.queried == timestamp)
        d = sums.one()._asdict()
        feesperkb = [tx.fee / (tx.size / Decimal(1024))
            for tx in s.query(Txn.fee, Txn.size).filter(Txn.queried == timestamp)]
        txnsum = TxnStat(
            queried=timestamp,
            txns=s.query(Txn).filter_by(queried=timestamp).count(),
            avgfeeperkb=(sum(feesperkb)/len(feesperkb)).quantize(PICONERO),
            **d)
        s.add(txnsum)
s.commit()

from decimal import Decimal
from datetime import datetime, timedelta
import operator
from sqlalchemy.sql import func

from .txndb import Txn, TxnStat

class Query(object):
    when = None
    _stats = None

    def __init__(self, dbsession, periods, bins=20):
        self.dbsession = dbsession
        self.periods = periods
        self.bins = bins

    def get_timeline(self, prop):
        if not self._stats:
            self.fetch_data()
        return {'timestamp': int(self.when.timestamp()), 'data': self.timelinegen(prop)}

    def get_hists(self, prop, period):
        try:
            return self._hists[period][prop]
        except KeyError:
            return []

    def fetch_data(self, when=None):
        self.when = when or datetime.now()
        maxperiod = max(self.periods.values())

        stats = self.dbsession.query(TxnStat) \
            .filter(TxnStat.queried > self.when - timedelta(seconds=maxperiod)) \
            .order_by(TxnStat.queried)
        self._stats = list(map(operator.attrgetter('__dict__'), stats.all()))

        self._hists = {}
        for label, period in self.periods.items():
            self._hists[label] = self._mkhists(period)

    def timelinegen(self, key):
        for x in self._stats:
            yield (int(x['queried'].timestamp()), x[key])

    def _mkhists(self, period):
        hists = {}
        hash_ids = set()
        txns = self.dbsession.query(Txn) \
            .filter(Txn.queried > self.when - timedelta(seconds=period)) \
            .order_by(Txn.queried)

        if txns.count() == 0:
            return hists

        # keep only one copy of each Txn, the first-seen one
        unique_txns = []
        for txn in txns.all():
            if txn.hash_id in hash_ids:
                continue
            hash_ids.add(txn.hash_id)
            unique_txns.append(txn)

        stats = self.dbsession.query(
                func.min(Txn.fee).label('minfee'),
                func.max(Txn.fee).label('maxfee'),
                func.min(Txn.size).label('minsize'),
                func.max(Txn.size).label('maxsize'),
                func.min(Txn.inputs).label('mininputs'),
                func.max(Txn.inputs).label('maxinputs'),
                func.min(Txn.outputs).label('minoutputs'),
                func.max(Txn.outputs).label('maxoutputs'),
                func.min(Txn.ring).label('minring'),
                func.max(Txn.ring).label('maxring')) \
            .filter(Txn.queried > self.when - timedelta(seconds=period)).one()

        hists['ring'] = self._mkhist(
            unique_txns,
            'ring',
            range(stats.minring, stats.maxring + 1))
        hists['inputs'] = self._mkhist(
            unique_txns,
            'inputs',
            range(stats.mininputs, stats.maxinputs + 1))
        hists['outputs'] = self._mkhist(
            unique_txns,
            'outputs',
            range(stats.minoutputs, stats.maxoutputs + 1))
        return hists

    def _mkhist(self, txns, key, bins):
        return []

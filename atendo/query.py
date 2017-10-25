from decimal import Decimal
from datetime import datetime
import operator

from .txndb import Txn, TxnStat

class Query(object):
    when = None

    def __init__(self, dbsession, periods=(60*60, 60*60*24, 60*60*24*7)):
        self.dbsession = dbsession
        self.periods = periods

    def fetch_stats(self, when=None):
        self.when = int((when or datetime.now()).timestamp())
        period = max(self.periods)
        stats = self.dbsession.query(TxnStat) \
            .filter(TxnStat.queried > self.when - period) \
            .order_by(TxnStat.queried)
        self._stats = list(map(operator.attrgetter('__dict__'), stats.all()))

    def timelinegen(self, key):
        for x in self._stats:
            yield (int(x['queried'].timestamp()), x[key])

    def get_timeline(self, prop):
        return {'timestamp': self.when, 'data': self.timelinegen(prop)}

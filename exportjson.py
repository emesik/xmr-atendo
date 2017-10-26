#!/usr/bin/python
import os
import re
import simplejson
import sys
import tempfile
from atendo.txndb import mksession
from atendo.query import Query
from atendo.utils import get_config_or_usage

config = get_config_or_usage()


def write_json(label, data):
    tmpfd, tmpname = tempfile.mkstemp(
        prefix="{0}-".format(label), suffix='.tmp.json', dir=config['output_dir'])
    tmpout = os.fdopen(tmpfd, 'w')
    simplejson.dump(data, tmpout, iterable_as_array=True)
    tmpout.close()
    os.rename(tmpname, os.path.join(config['output_dir'], "{0}.json".format(label)))


s = mksession(config['db_url'])
periods = {
    '1h': 60 * 60,
    '1d': 60 * 60 * 24,
#    '1w': 60 * 60 * 24 * 7
}
q = Query(s, periods)
for prop in ('txns', 'sumfee', 'sumsize', 'avgsize', 'avgfee', 'avgfeeperkb'):
    write_json("timeline-{0}".format(prop), q.get_timeline(prop))
for period in periods.keys():
    for prop in ('inputs', 'outputs', 'ring', 'fee', 'size'):
        write_json("hist-{0}-{1}".format(prop, period), q.get_hists(prop, period))

#!/usr/bin/python
import logging
import os
import re
import simplejson
import sys
import tempfile
from atendo.txndb import mksession
from atendo.query import Query
from atendo.utils import get_config_or_usage

usage = "Usage: {0} <config.json> [timelines|histograms|all]\n\n" \
        "\t\"all\" is default\n\n"
config = get_config_or_usage(usage)
what = sys.argv[2] if len(sys.argv) > 2 else 'all'
if what not in ('timelines', 'histograms', 'all'):
    print(usage.format(*sys.argv), file=sys.stderr)
    sys.exit(-1)
log = logging.getLogger(sys.argv[0])

def write_json(label, data):
    tmpfd, tmpname = tempfile.mkstemp(
        prefix="{0}-".format(label), suffix='.tmp.json', dir=config['output_dir'])
    tmpout = os.fdopen(tmpfd, 'w')
    simplejson.dump(data, tmpout, iterable_as_array=True)
    tmpout.close()
    os.chmod(tmpname, 0o644)
    os.rename(tmpname, os.path.join(config['output_dir'], "{0}.json".format(label)))


s = mksession(config['db_url'])
try:
    periods = config['exportjson']['periods']
except KeyError:
    periods = {
        '1h': 60 * 60,
        '1d': 60 * 60 * 24,
        '1w': 60 * 60 * 24 * 7
    }
q = Query(s, periods, maxtimeline='1d')
if what in ('timelines', 'all'):
    for prop in ('txns', 'sumfee', 'sumsize', 'avgsize', 'avgfee', 'avgfeeperkb'):
        name = "timeline-{0}".format(prop)
        try:
            write_json(name, q.get_timeline(prop))
        except Exception:
            log.exception("Failed to generate {0}".format(name))
if what in ('histograms', 'all'):
    for period in periods.keys():
        for prop in ('inputs', 'outputs', 'ring', 'fee', 'size'):
            name = "hist-{0}-{1}".format(prop, period)
            try:
                write_json(name, q.get_hists(prop, period))
            except Exception:
                log.exception("Failed to generate {0}".format(name))

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

s = mksession(config['db_url'])
q = Query(s)
q.fetch_stats()
for prop in ('txns', 'sumfee', 'sumsize', 'avgsize', 'avgfee', 'avgfeeperkb'):
    tmpfd, tmpname = tempfile.mkstemp(
        prefix="{0}-".format(prop), suffix='.tmp.json', dir=config['output_dir'])
    tmpout = os.fdopen(tmpfd, 'w')
    simplejson.dump(q.get_timeline(prop), tmpout, iterable_as_array=True)
    tmpout.close()
    os.rename(tmpname, os.path.join(config['output_dir'], "{0}.json".format(prop)))

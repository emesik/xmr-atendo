#!/usr/bin/python
import json
import sys
from atendo.txndb import create_tables

try:
    config = json.loads(open(sys.argv[1], 'r').read())
except Exception:
    print("Usage: {0} <config.json>".format(*sys.argv), file=sys.stderr)
    raise

create_tables(config['db_url'])

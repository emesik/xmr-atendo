#!/usr/bin/python
import json
import sys
from atendo import Atendo

try:
    config = json.loads(open(sys.argv[1], 'r').read())
except Exception:
    print("Usage: {0} <config.json>".format(*sys.argv), file=sys.stderr)
    raise

atendo = Atendo(**config)
atendo.fetch()

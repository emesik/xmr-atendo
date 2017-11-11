import json
import sys

def get_config_or_usage(usage=None):
    usage = usage or "Usage: {0} <config.json>\n\n"
    try:
        return json.loads(open(sys.argv[1], 'r').read())
    except Exception:
        print(usage.format(*sys.argv), file=sys.stderr)
        raise

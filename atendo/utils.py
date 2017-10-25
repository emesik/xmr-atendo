import json
import sys

def get_config_or_usage():
    try:
        return json.loads(open(sys.argv[1], 'r').read())
    except Exception:
        print("Usage: {0} <config.json>\n\n".format(*sys.argv), file=sys.stderr)
        raise

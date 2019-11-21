#!/usr/bin/python
import json
import logging
import sched
import sys
import time
from atendo import Atendo
from atendo.utils import get_config_or_usage

config = get_config_or_usage()
logging.basicConfig(level=config.get('log_level', 'INFO'))
log = logging.getLogger(sys.argv[0])
try:
    loop = config['loop_fetch']['seconds']
except KeyError:
    loop = None

atendo = Atendo(
    daemon_host=config.get('daemon_host', None),
    daemon_port=config.get('daemon_port', None),
    db_url=config.get('db_url', None),
    timeout=config.get('timeout', 20)
    )

if loop:
    def fetch():
        log.debug("fetching data")
        s.enter(loop, 1, fetch)
        try:
            atendo.fetch()
        except Exception:
            log.exception("Fetch failed")

    log.info("Will fetch data every {0} second(s)".format(loop))
    s = sched.scheduler(time.time, time.sleep)
    s.enter(loop, 1, fetch)
    s.run()
else:
    # run only once
    atendo.fetch()

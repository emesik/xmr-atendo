#!/usr/bin/python
import json
import sys
from atendo import Atendo
from atendo.utils import get_config_or_usage

config = get_config_or_usage()
del config['output_dir']

atendo = Atendo(
    daemon_host=config.get('daemon_host', None),
    daemon_port=config.get('daemon_port', None),
    db_url=config.get('db_url', None)
    )
atendo.fetch()

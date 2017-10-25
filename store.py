#!/usr/bin/python
import json
import sys
from atendo import Atendo
from atendo.utils import get_config_or_usage

config = get_config_or_usage()

atendo = Atendo(**config)
atendo.fetch()

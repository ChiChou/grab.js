#!/usr/bin/env python
from __future__ import print_function

import os
import errno
import ujson
import urllib

from pyparsing import Keyword, Word, QuotedString, Optional, Group, printables, ZeroOrMore


def relpath(*args):
    basedir = os.path.realpath(os.path.dirname(__file__))
    return os.path.join(basedir, *args)


def nmap_rule_parser():
    mode = Keyword('softmatch') | Keyword('match')
    service = Word(printables)
    regex = Group(Keyword('m') + (QuotedString('=') | QuotedString('|') | QuotedString('%')) + Optional(Word('si')))
    template = (QuotedString('/') | QuotedString('|'))
    cpe = Group(Keyword('cpe:') + template + Optional(Word('a')))
    attr = Group(Word('pvihod') + template)
    attrs = Group(ZeroOrMore(attr | cpe))

    return mode + service + regex + attrs

def nmap_probe_parser():
    probe = Keyword('Probe')
    proto = Keyword('TCP') | Keyword('UDP')
    name = Word(printables)
    payload = Group(Keyword('q') + QuotedString('|'))

    return probe + proto + name + payload

rule_parser = nmap_rule_parser().parseString
payload_parser = nmap_probe_parser().parseString


def update_from_git():
    print('Downloading from github')
    urllib.urlretrieve(
        'https://github.com/nmap/nmap/blob/master/nmap-service-probes?raw=true', 
        relpath('tmp', 'nmap-service-probes'))
    print('Done')


def escape_service(service):
    # hack
    if service == 'http-proxy':
        return 'http'

    # ssl
    if '/' in service:
        return service.replace('/', '-')

    return service


def mkdirp(path):
    try:
        os.makedirs(path)
    except OSError as e:
        if e.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else:
            raise


def handle_probe(line):
    parsed = payload_parser(line)
    probe, proto, name, payload = parsed
    prefix, body = payload

    filename = relpath('payloads', proto.lower(), name)
    mkdirp(os.path.dirname(filename))
    with open(filename, 'w') as fd:
        fd.write(body.decode('string_escape'))


def handle_rule(line, probe_files):
    key_lookup = {'p': 'product', 'v': 'version', 'i': 'info', 'h': 'hostname', 'o': 'os', 'd': 'device'}
    required_keys = ['pattern', 'flag', 'cpes', 'matchers']

    parsed = rule_parser(line)
    match, service, regex, info = parsed

    service = escape_service(service)

    # save to file
    if service not in probe_files:
        output_name = relpath('probes', service)
        mkdirp(os.path.dirname(output_name))
        probe_files[service] = open(output_name, 'w')

    if len(regex) == 3:
        prefix, pattern, flag = regex
    else:
        prefix, pattern = regex
        flag = ''

    matchers = {}
    cpes = []

    for item in info:
        if len(item) == 3:
            key, template, tail = item
        else:
            key, template = item

        if key == 'cpe:':
            cpes.append(template)
        else:
            field = key_lookup[key]
            matchers[field] = template

    vals = locals()
    data = {name: vals[name] for name in required_keys}
    probe_files[service].write(ujson.dumps(data) + '\n')


def optimize():
    print('Optimizing probes and rules')

    nmap_probes = open(relpath('tmp', 'nmap-service-probes'))
    probe_files = {}

    for line in nmap_probes:
        if line.startswith('match'):
            handle_rule(line, probe_files)

        elif line.startswith('Probe '):
            handle_probe(line)

    for service, fd in probe_files.items():
        fd.close()

    nmap_probes.close()


def main():
    update_from_git()
    optimize()


if __name__ == '__main__':
    main()
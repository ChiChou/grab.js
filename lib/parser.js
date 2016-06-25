'use strict'

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const __cache__ = {}

function loadRule(line) {
  let deserialized = JSON.parse(line)

  // js dotall workaround
  if (deserialized.flag.indexOf('s') > -1) {
    deserialized.pattern = deserialized.pattern.replace(/\.\*/g, '[\S\s]*')
    deserialized.flag = deserialized.flag.replace('s', '')
  }

  deserialized.re = new RegExp(deserialized.pattern, deserialized.flag)
  return deserialized
}

function placeholder(matches) {
  return template => template.replace(/\$(\d+)/g,
    (match, val, offset, str) => matches[+val])
}

function getParser(probe) {
  if (__cache__.hasOwnProperty(probe))
    return Promise.resolve(__cache__[probe])

  let probeFileName = path.join(__dirname, '..', 'nmap', 'parsers', probe)
  return new Promise((resolve, reject) => {
    const rules = []
    readline.createInterface({
        input: fs.createReadStream(probeFileName)
      })
      .on('line', line => rules.push(loadRule(line)))
      .on('close', () => {
        let parser = new BannerParser(probe, rules)
        let method = __cache__[probe] = parser.parse.bind(parser)
        resolve(method)
      })
      .on('error', reject)
  })
}

class BannerParser {
  constructor(probe, rules) {
    this.probe = probe
    this.rules = rules
  }

  parse(record) {
    let result = {
      service: this.probe
    }
    let banner = record.banner
    for (let rule of this.rules) {
      let matches = rule.re.exec(banner)
      let render = placeholder(matches)
      if (matches) {
        result.cpes = rule.cpes.map(render)
        for (let key of Object.keys(rule.matchers)) {
          result[key] = render(rule.matchers[key])
        }
        break
      }
    }
    return result
  }
}

exports.parser = getParser

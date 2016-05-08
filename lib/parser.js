'use strict'

const fs = require('fs')
const path = require('path')
const readline = require('readline')


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

class BannerParser {
  constructor(probe) {
    if (typeof probe !== 'string')
      throw Error('probe must be a valid file name')
    
    this.probe = probe
    this.rules = []
    this.ready = false
  }

  parse(record) {
    let banner = record.banner
    return new Promise((resolve, reject) => {
      let doParse = () => {
        let result = {}
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
        resolve(result)
      }

      if (this.ready) {
        doParse()
      } else {
        let probeFileName = path.join(__dirname, '..', 'nmap', 'parsers', this.probe)
        this.__readline__ = readline.createInterface({
            input: fs.createReadStream(probeFileName)
          })
          .on('line', line => this.rules.push(loadRule(line)))
          .on('close', () => {
            this.ready = true
            doParse()
          })
          .on('error', reject)
      }
    })
  }
}

exports.parse = function(probe) {
  let parser = new BannerParser(probe)
  return probe => parser.parse(probe)
}

exports.BannerParser = BannerParser

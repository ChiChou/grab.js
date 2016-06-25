#!/usr/bin/env node

'use strict'

const grabber = require('./lib')
const program = require('commander')
const fs = require('fs')
const path = require('path')

const read = filename => fs.readFileSync(grabber.payload(filename), 'utf8')

program
  .version(require('./package.json').version)
  .option('-p, --port <n>', 'port number', parseInt)
  .option('-s, --tls', 'with tls')
  .option('--payload <file>', 'payload file', read)
  .option('--parser <parser>', 'parse with nmap rule')
  .option('--encoding [encoding]', 'encode banner', /^(base64|hex)$/)
  .option('--timeout <timeout>', 'timeout', parseInt)
  .parse(process.argv)

function run(parser) {
  let parse = data => data
  if (parser) {
    parse = data =>
      (Object.keys(parsed).forEach(key => (data[key] = parsed[key])), data)
  }

  const grab = ip => grabber.grab(ip, program.port, {
      tls: program.tls,
      payload: program.payload,
      timeout: program.timeout
    })
    .run()
    .then(parse)
    .then(data => {
      data.ip = ip
      data.banner = program.encoding ?
        data.banner.toString(program.encoding) :
        grabber.escape(data.banner)
      return data
    })
    .catch(err => ({ ip: ip, error: err.message }))
    .then(JSON.stringify)
    .then(console.log)

  process.stdin
    .on('data', buf => buf.toString().split('\n').filter(ip => ip).forEach(grab))

}

if (program.parser) {
  grabber.parser(program.parser).then(run).catch(() => {
    console.error('Invalid parser name')
    process.exit(-1)
  })
} else {
  run()
}

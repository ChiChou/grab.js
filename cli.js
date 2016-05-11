#!/usr/bin/env node
'use strict'

const grabber = require('./lib')
const program = require('commander')
const fs = require('fs')
const path = require('path')

const read = filename => fs.readFileSync(
  path.join(__dirname, 'nmap', 'payloads', filename), 'utf8')

program
  .version(require('./package.json').version)
  .option('-p, --port <n>', 'port number', parseInt)
  .option('-s, --tls', 'with tls')
  .option('--payload <file>', 'payload file', read)
  .option('--parser <parser>', 'parse with nmap rule')
  .option('--encoding [encoding]', 'encode banner', /^(base64|hex)$/)
  .option('--timeout <timeout>', 'timeout', parseInt)
  .option('--after', 'grab after zmap has been finished')
  .parse(process.argv)

let parse = program.parser ? (() => {
    let bannerParser = grabber.parse(program.parser)
    return data => bannerParser(data).then(parsed => 
      (Object.keys(parsed).forEach(key => (data[key] = parsed[key])), data))
  })() : data => data

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
      data.banner.toEscaped()
    return data
  })
  .then(JSON.stringify)
  .then(console.log)
  .catch(err => console.log({ip: ip, error: err.message}))

if (program.after) {
  let list = ''
  process.stdin
    .on('data', buf => list += buf.toString())
    .on('close', () => list.split('\n').filter(ip => ip).forEach(grab))

} else {
  process.stdin
    .on('data', buf => buf.toString().split('\n').filter(ip => ip).forEach(grab))
}

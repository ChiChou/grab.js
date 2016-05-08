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
  .option('--encoding [encoding]', 'encode banner', /^(escape|base64|hex)$/)
  .parse(process.argv)

let parse = program.parser ? (() => {
    let bannerParser = grabber.parse(program.parser)
    return data => bannerParser(data).then(parsed => 
      (Object.keys(parsed).forEach(key => (data[key] = parsed[key])), data))
  })() : data => data

process.stdin.on('data', buf =>
  buf.toString().split('\n').filter(ip => ip).forEach(ip => 
    grabber.grab(ip, program.port, { tls: program.tls, payload: program.payload })
      .run()
      .then(parse)
      .then(data => {
        data.ip = ip
        data.banner = program.encoding === 'escape' ? 
          data.banner.toEscaped() : data.banner.toString(program.encoding)
        return data
      })
      .then(JSON.stringify)
      .then(console.log)
      .catch(err => console.log({ip: ip, error: err.message}))
  )
)

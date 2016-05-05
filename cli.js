'use strict';

const grabber = require('./lib');
const program = require('commander');
const fs = require('fs');
const path = require('path');

const read = filename => fs.readFileSync(path.join(__dirname, 'nmap', 'payloads', filename), 'utf8')

program
  .version(require('./package.json').version)
  .option('-p, --port <n>', 'port number', parseInt)
  .option('-s, --tls', 'with tls')
  .option('--skip-error', 'skip error messages')
  .option('--payload <file>', 'payload file', read)
  .option('--parse <parser>', 'parse with nmap rule')
  .parse(process.argv)

let parse;

if (program.parse) {
  parse = grabber.parse(program.parse);
}

process.stdin.on('data', buf =>
  buf.toString().split('\n').map(ip => {
    let task = grabber.grab(ip, program.port, { tls: program.tls, payload: program.payload })
      .run()
      .then(data => {
        console.log(ip + '\t' + data.banner.toEscaped())
        return data;
      })

    if (parse)
      task.then(parse).then(parsed => {
        for (let key of Object.keys(parsed))
          console.log(`${key}: ${parsed[key]}`)
      })

    if (!program.skipError)
      task.catch(err => console.error(`[err] ${ip}: ${err.message}`));
  })
)

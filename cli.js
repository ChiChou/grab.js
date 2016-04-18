'use strict';

const grabber = require('./lib');
const program = require('commander');

program
  .version(require('./package.json').version)
  .option('-p, --port <n>', 'port number', parseInt)
  .option('-s, --tls', 'with tls')
  .option('-b, --bandwidth', 'bandwidth')
  .option('-v, --verbose', 'log detailed messages')
  .option('--skip-error', 'skip error messages')
  .parse(process.argv)

let args = ['-p', program.port, '-B', program.bandwidth || '1M'];
program.host && args.push(program.host);
program.args && [].push.apply(args, program.args);

let zmap = require('child_process').spawn('zmap', args);

zmap.stdout.on('data', buf => {
  let list = buf.slice(0, buf.length - 1).toString();

  list.split('\n').map(ip => {
    let task = grabber.grab(ip, program.port, { tls: program.tls })
    .run()
    .then(data => console.log(ip + '\t' + data.banner.toEscaped()))

    if (!program.skipError)
      task.catch(console.error);
  })
  
});

if (program.verbose) {
  zmap
    .on('close', code => console.info(`zmap exited with code ${code}`))
    .stderr.on('data', buf => process.stderr.write('[zmap]' + buf));
}

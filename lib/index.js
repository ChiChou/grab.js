'use strict';

const net = require('net');

class Grab {
  constructor(host, port, opt) {
    this.host = host;
    this.port = port;
    this.opt = opt || {};
  }

  run() {
    let banner = [];
    let self = this;
    return new Promise((resolve, reject) => {
      let client = new net.Socket();
      let finish = (err) => {
        if (banner.length)
          resolve(Buffer.concat(banner));
        else
          reject(err || new Error(`Unable to read banner from ${self.host}:${self.port}`));
      }

      client.setTimeout(this.opt.timeout || 100, client.destroy)
        .connect(this.port, this.host, () => {
          // client.end()
        })
        .on('data', data => {banner.push(data)})
        .on('error', finish)
        .on('close', finish) // .on('end', () => {})
    });
  }
}

exports.grab = function(host, port) {
  return new Grab(host, port);
}
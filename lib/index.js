'use strict';

// add toEscaped method to buffer
require('./escape');

const net = require('net');
const tls = require('tls');

const DEFAULT_TIME_OUT = 5000;

class Grab {
  constructor(host, port, opt) {
    this.host = host;
    this.port = port;
    this.opt = opt || {};
  }

  run() {
    let banners = [];
    let result = {};
    let self = this;

    return new Promise((resolve, reject) => {
      let finish = (err) => {
        if (banners.length) {
          result.banner = Buffer.concat(banners);
          return resolve(result);
        }

        reject(err || new Error(`Unable to read banner from ${self.host}:${self.port}`));
      }

      let socket;

      if (self.opt.tls) {
        socket = tls.connect(this.port, this.host, { rejectUnauthorized: false }, () => {
          result.certificate = socket.getPeerCertificate(true);
          delete result.certificate.raw;
          // TODO: send payload
        });

      } else {
        socket = new net.Socket()
          .connect(this.port, this.host, () => {
            // TODO: send payload
          })
      }

      socket
        .setTimeout(this.opt.timeout || DEFAULT_TIME_OUT, socket.destroy)
        .on('data', banners.push.bind(banners))
        .on('error', finish)
        .on('close', finish);

    });
  }
}

exports.grab = function(host, port, opt) {
  return new Grab(host, port, opt);
}

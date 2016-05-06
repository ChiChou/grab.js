'use strict'

// add toEscaped method to buffer
require('./escape')

const net = require('net')
const tls = require('tls')

const DEFAULT_TIMEOUT = 5000

class Grab {
  constructor(host, port, opt) {
    this.host = host
    this.port = port
    this.opt = opt || {}
  }

  payload(buf) {
    this.opt.payload = buf
    return this
  }

  run() {
    let banners = []
    let result = {}
    let self = this

    return new Promise((resolve, reject) => {
      let finish = (err) => {
        if (banners.length) {
          result.banner = Buffer.concat(banners)
          return resolve(result)
        }

        reject(err instanceof Error ? err : 
          new Error(`Unable to read banner from ${self.host}:${self.port}`))
      }

      let socket;

      if (self.opt.tls) {
        socket = tls.connect(this.port, this.host, { rejectUnauthorized: false }, () => {
          result.certificate = socket.getPeerCertificate(true);
          delete result.certificate.raw;

          let issuerCert = result.certificate.issuerCertificate;
          while (issuerCert) {
            delete issuerCert.raw;
            issuerCert = issuerCert.issuerCertificate;
          }

          if (self.opt.payload)
            socket.write(self.opt.payload)
        });

      } else {
        socket = new net.Socket()
          .connect(this.port, this.host, () => {
            if (self.opt.payload)
              socket.write(self.opt.payload)
          })
      }

      socket
        .setKeepAlive(false)
        .setTimeout(this.opt.timeout || DEFAULT_TIMEOUT, socket.destroy.bind(socket))
        .on('data', data => {
          banners.push(data)
          if (self.opt.noKeepAlive)
            socket.end();
        })
        .on('error', finish)
        .on('close', finish)

    });
  }
}

exports.grab = function(host, port, opt) {
  return new Grab(host, port, opt)
};

exports.parse = require('./parser').parse

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
    const self = this

    return new Promise((resolve, reject) => {
      let socket

      if (this.opt.tls) {
        socket = tls.connect(this.port, this.host, { rejectUnauthorized: false }, () => {
          this.open = true
          result.certificate = socket.getPeerCertificate(true)
          delete result.certificate.raw
          delete result.certificate.issuerCertificate

          if (this.opt.payload)
            socket.write(this.opt.payload)
        })

      } else {
        socket = net.createConnection(this.port, this.host, () => {
          this.open = true
          if (this.opt.payload) {
            socket.write(this.opt.payload)
          }
        })
      }

      socket
        .setKeepAlive(!this.opt.noKeepAlive)
        .setTimeout(this.opt.timeout || DEFAULT_TIMEOUT)
        .on('data', data => {
          banners.push(data)
          if (this.opt.noKeepAlive || !this.opt.payload) {
            socket.end()
          }
        })
        .on('error', err => (this.error = err))
        .on('close', hadErr => {
          result.banner = Buffer.concat(banners)
          if (this.open) {
            resolve(result)
          } else {
            reject(this.error || new Error(`Unable to retrive banner from ${this.host}`))
          }
        })
        .on('timeout', socket.destroy.bind(socket))
    })
  }
}

exports.grab = function(host, port, opt) {
  return new Grab(host, port, opt)
}

exports.parse = require('./parser').parse

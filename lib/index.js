'use strict'

const net = require('net')
const tls = require('tls')
const path = require('path')

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
          if (this.timeout && !banners.length) {
            reject(new Error(`Read from ${this.host} timed out`))
          } else if (this.open) {
            resolve(result)
          } else {
            reject(this.error)
          }
        })
        .on('timeout', () => {
          this.timeout = true
          socket.destroy()
        })

    })
  }
}

exports.grab = (host, port, opt) => new Grab(host, port, opt)
exports.payload = filename => path.join(__dirname, '..', 'nmap', 'payloads', filename)
exports.parser = require('./parser').parser
exports.escape = require('./escape').escape

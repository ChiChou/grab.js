'use strict';

const grabber = require('../lib');
const chai = require('chai'),
  expect = chai.expect;

const net = require('net'),
  tls = require('tls'),
  https = require('https'),
  fs = require('fs'),
  path = require('path');

describe('grabber', () => {
  it('should read banner', done => {
    let randomBanner = 'This-Is-A-TCP-Banner\n' + Math.random().toString(16);
    let server = net.createServer(socket => socket.end(randomBanner))
      .listen(() => {
        grabber.grab('127.0.0.1', server.address().port)
          .run()
          .then(result => {
            expect(result.banner.toString()).to.equals(randomBanner);
            done();
          })
          .catch(done);
      });
  });

  it('should support tls', done => {
    let key = name => path.join(__dirname, 'keys', name);
    let options = {
      key: fs.readFileSync(key('server-key.pem')),
      ca: [fs.readFileSync(key('ca-key.pem'))],
      cert: fs.readFileSync(key('server-cert.pem'))
    };

    let randomBanner = 'This-Is-A-Server-With-TLS\n' + Math.random().toString(16);
    let server = tls.createServer(options, socket => socket.end(randomBanner))
      .listen(() => {
        grabber.grab('127.0.0.1', server.address().port, { tls: true })
          .run()
          .then(result => {
            expect(result.banner.toString()).to.equals(randomBanner);
            expect(result).to.have.property('certificate');
            done();
          })
          .catch(done);
      });
  });

  it('should support payload', done => {
    let randomBanner = 'This-Is-A-TCP-Banner\n' + Math.random().toString(16);
    let payload = new Buffer(Math.random().toString(36));
    let server = net.createServer(socket =>
        socket.on('data', data => {
          if (data.compare(payload) === 0)
            socket.end(randomBanner)
          else
            socket.end()
        }))
      .listen(() => {
        grabber.grab('127.0.0.1', server.address().port)
          .payload(payload)
          .run()
          .then(result => {
            expect(result.banner.toString()).to.equals(randomBanner);
            done();
          })
          .catch(done);
      });
  });

  it('should reject when time reached', done => {
    grabber.grab('8.8.8.8', 80, { timeout: 10 })
      .run()
      .catch(err => {
        expect(err.toString()).to.match(/^Error: Unable to read banner/);
        done();
      });
  });

});

describe('buffer escape', () => {
  it('should escape unprintable chars', done => {
    expect(new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]).toEscaped()).to.equals('buffer');
    expect(new Buffer([0x00, 0x09, 0x20, 0x0A, 0xFF]).toEscaped()).to.equals('\\x00\\t \n\\xFF');

    done();
  })
});

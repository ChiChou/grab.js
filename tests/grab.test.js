'use strict';

const grabber = require('../lib');
const chai = require('chai'),
  expect = chai.expect;

const net = require('net'),
  tls = require('tls'),
  https = require('https'),
  fs = require('fs'),
  path = require('path');

describe('homepage', () => {
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
});

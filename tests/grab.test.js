'use strict';

const grabber = require('../lib');
const chai = require('chai'),
  expect = chai.expect;

const net = require('net'),
  tls = require('tls'),
  https = require('https'),
  fs = require('fs'),
  path = require('path');

const key = name => path.join(__dirname, 'keys', name);

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

  it('should support https (tls and payload)', done => {
    const options = {
      key: fs.readFileSync(key('server-key.pem')),
      cert: fs.readFileSync(key('server-cert.pem'))
    };

    const signature = Math.random().toString(36);

    let server = https.createServer(options, (req, res) => {
      res.writeHead(200);
      res.end(signature);
    }).listen(() => {
      let port = server.address().port;
      grabber.grab('127.0.0.1', port, { tls: true, noKeepAlive: true })
        .payload(new Buffer(`GET / HTTP/1.1\r\n\r\n`))
        .run()
        .then(result => {
          expect(result.banner.toString()).to.includes(signature);
          done();
        })
        .catch(done);
    });

  });

  it('should reject when timeout', done => {
    let silentServer = net.createServer( /* listening but never send banner */ )
      .listen(() => {
        grabber.grab('127.0.0.1', silentServer.address().port, { timeout: 10 })
          .run()
          .catch(err => {
            expect(err instanceof Error).to.be.true;
            done();
          });
      });
  });

  it('should reject when destination unavaliable', done => {
    grabber.grab('169.254.1.1', 21, { timeout: 20 })
      .run()
      .catch(err => {
        expect(err instanceof Error).to.be.true;
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

describe('banner parser', () => {
  it('should parse cpe and version', done => {
    let data = {
      banner: new Buffer('SSH-2.0-OpenSSH_6.0p1 Debian-4+deb7u3\r\n')
    };

    let parse = grabber.parse('ssh');

    parse(data)
      .then(result => {
        expect(result.cpes).to.includes('o:debian:debian_linux');
        expect(result.info).to.equals('protocol 2.0');
      })
      // parse again
      .then(() => parse(data))
      .then(() => done());
  });

});

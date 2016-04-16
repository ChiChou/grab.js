'use strict';

const grabber = require('../lib');
const chai = require('chai'), expect = chai.expect;

describe('homepage', () => {
  it('should read banner', done => {
    let bannerExample = 'This-Is-A-TCP-Banner\n';
    let dummy = require('net').createServer((socket) => {
      socket.end(bannerExample);
    }).listen(() => {
      let address = dummy.address();
      grabber.grab('127.0.0.1', address.port)
        .run()
        .then(data => {
          expect(data.toString()).to.equals(bannerExample)
          done();
        })
        .catch(done);
    });
  });
});


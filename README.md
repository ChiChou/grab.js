# grab.js [![Coverage Status](https://coveralls.io/repos/github/ChiChou/grab.js/badge.svg?branch=master)](https://coveralls.io/github/ChiChou/grab.js?branch=master) [![Build Status](https://travis-ci.org/ChiChou/grab.js.svg?branch=master)](https://travis-ci.org/ChiChou/grab.js)

## Usage

### Quick Example

```js
const grabber = require('grab.js');
grabber.grab(ip, port)
  .run()
  .then(result => { /* process the result */ })
  .catch(err => { /* error handling */ })
```

## Api

### grabber.grab(ip, port, options}

Returns a `Grab` object. You need to call `run` method to execute it.

* `ip`: target ip
* `port` port number
* `options` (optional): An object contains initial settings for the `Grab`, supports `tls` and `payload` and both of them are optional.

### Grab#run()

Exeute the task, returns a Promise which yields a record. The record can have following fields:

* `record.banner`: the banner Buffer
* `record.certificate`: certificate information (only avaliable when TLS is enabled)

### Grab.tls

Enable TLS.

### Grab.payload

The `Buffer` to send when connection established. Payload file can be found under `nmap/paylaods`.

### grabber.parse(parser)

Create a BannerParser with given parser rule name. Rule names can be found under `nmap/parsers`.

### BannerParser#parse()

## Command util

This project provides a cli tool for quick banner grab like [zgrab](http://github.com/zmap/zgrab)

For example, scanning ftp banner on given CIDR:

`sudo zmap -p 80 [cidr] | node cli.js -p 80 --payload=tcp/GetRequest --parse http` 

Leave cidr blank to scan `0.0.0.0/20`

### Options

* `-p, --port` the port
* `-s, --tls` use tis (https, imaps, etc)
* `--skip-error` skip error messages
* `--payload` send a payload upon connection. Extracted from nmap
* `--parse` parse banner with nmap's rule

## Special thanks 

Thanks to the marvellous [nmap project](https://nmap.org) who has collected so many rules for fingerprinting.

## License

MIT & GPL
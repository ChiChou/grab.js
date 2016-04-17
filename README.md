# grab.js [![Coverage Status](https://coveralls.io/repos/github/ChiChou/grab.js/badge.svg?branch=master)](https://coveralls.io/github/ChiChou/grab.js?branch=master) [![Build Status](https://travis-ci.org/ChiChou/grab.js.svg?branch=master)](https://travis-ci.org/ChiChou/grab.js)

## Usage

```js
const grabber = require('grab.js');
grabber.grab(ip, port)
  .run()
  .then(result => { /* process the result */ })
  .catch(err => { /* error handling */ })
```

## Command util

This project provides a cli tool for quick banner scanning.

For example, scanning ftp banner on given CIDR:

`node cli.js -p 21 [cidr]` 

Leave cidr as blank to scan `0.0.0.0/20`
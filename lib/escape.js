'use strict';

Buffer.prototype.__printable__ = Array(256).fill().map(
  (e, i) => ({
    8: '\\b',
    9: '\\t',
    // do not escape
    10: '\n',
    13: '\r',
    32: ' '
  })[i] || (31 < i && 127 > i ?
    String.fromCharCode(i) :
    '\\x' + ('0' + i.toString(16)).substr(-2).toUpperCase()))

Buffer.prototype.toEscaped = function() {
  let escaped = '';
  for (let byte of this) {
    escaped += this.__printable__[byte];
  }
  return escaped;
};

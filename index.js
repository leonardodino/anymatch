'use strict';

const picomatch = require('picomatch');
const normalizePath = require('normalize-path');

/**
 * @typedef {(string:String) => boolean} AnymatchFn
 * @typedef {string|RegExp|AnymatchFn} AnymatchPattern
 * @typedef {AnymatchPattern|Array<AnymatchPattern>} AnymatchMatcher
 */

const BANG = '!';
const arrify = (item) => Array.isArray(item) ? item : [item];

/**
 * @param {AnymatchPattern} matcher
 * @returns {Function}
 */
const createPattern = (matcher) => {
  if (typeof matcher === 'function') {
    return matcher;
  }
  if (typeof matcher === 'string') {
    const glob = picomatch(matcher);
    return (string) => matcher === string || glob(string);
  }
  if (matcher instanceof RegExp) {
    return (string) => matcher.test(string);
  }
  return (string) => false;
};

/**
 * @param {Array<AnymatchFn>} patterns
 * @param {Array<AnymatchFn>} negatedGlobs
 * @param {String|Array} path
 * @param {Boolean} returnIndex
 */
const matchPatterns = (patterns, negatedGlobs, path, returnIndex) => {
  const additionalArgs = Array.isArray(path);
  const upath = normalizePath(additionalArgs ? path[0] : path);
  if (negatedGlobs.length > 0) {
    for (let index = 0; index < negatedGlobs.length; index++) {
      const nglob = negatedGlobs[index];
      if (nglob(upath)) {
        return returnIndex ? -1 : false;
      }
    }
  }
  for (let index = 0; index < patterns.length; index++) {
    const pattern = patterns[index];
    if (additionalArgs) {
      if (pattern(...path)) {
        return returnIndex ? index : true;
      }
    } else {
      if (pattern(upath)) {
        return returnIndex ? index : true;
      }
    }
  }

  return returnIndex ? -1 : false;
};

/**
 * @param {AnymatchMatcher} matchers
 * @param {String|Array<String>} testString
 * @param {Boolean=} returnIndex
 * @returns {boolean|Number|Function}
 */
const anymatch = (matchers, testString, returnIndex = false) => {
  if (matchers == null) {
    throw new TypeError('anymatch: specify first argument');
  }
  // Early cache for matchers.
  const mtchers = arrify(matchers);
  const negatedGlobs = mtchers
    .filter(item => typeof item === 'string' && item.charAt(0) === BANG)
    .map(item => item.slice(1))
    .map(item => picomatch(item));
  const patterns = mtchers.map(createPattern);

  if (testString == null) {
    return (testString, ri = false) => {
      const returnIndex = typeof ri === 'boolean' ? ri : false;
      return matchPatterns(patterns, negatedGlobs, testString, returnIndex);
    }
  }
  if (!Array.isArray(testString) && typeof testString !== 'string') {
    throw new TypeError('anymatch: second argument must be a string: got ' +
      Object.prototype.toString.call(testString))
  }

  return matchPatterns(patterns, negatedGlobs, testString, returnIndex);
};

module.exports = anymatch;

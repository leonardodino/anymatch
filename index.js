'use strict';

var micromatch = require('micromatch');

var anymatch = function(criteria, value, returnIndex, startIndex, endIndex) {
  if (!Array.isArray(criteria)) { criteria = [criteria]; }
  if (arguments.length === 1) {
    return criteria.length === 1 ?
      micromatch.matcher(criteria[0]) : anymatch.bind(null, criteria);
  }
  var string = Array.isArray(value) ? value[0] : value;
  if (!startIndex) { startIndex = 0; }
  var matchIndex = -1;
  function testCriteria (criterion, index) {
    var result;
    switch (toString.call(criterion)) {
    case '[object String]':
      result = string === criterion || micromatch.isMatch(string, criterion);
      break;
    case '[object RegExp]':
      result = criterion.test(string);
      break;
    case '[object Function]':
      result = criterion.apply(null, Array.isArray(value) ? value : [value]);
      break;
    default:
      result = false;
    }
    if (result) { matchIndex = index + startIndex; }
    return result;
  }
  var matched = criteria.slice(startIndex, endIndex).some(testCriteria);
  return returnIndex === true ? matchIndex : matched;
};

module.exports = anymatch;

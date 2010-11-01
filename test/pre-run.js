// This file is run in global scope after every script.

// Print w/ new line
function print(str) {
  require('util').print(str+'\n');
}

// Hooks
var hooks = {
  eval: function(eval) {
    var desugar = require('e4x-bump').desugar;
    return function(src) {
      return eval(desugar(src));
    }
  },

  reportCompare: function(reportCompare) {
    return function(expected, actual, description) {
      if (expected instanceof XML && actual instanceof XML) {
        return reportCompare(true, XML(expected) == XML(actual), description);
      } else {
        return reportCompare(expected, actual, description);
      }
    };
  },

  compareSource: function(compareSource) {
    var desugar = require('e4x-bump').desugar;
    function desugarLoose(src) {
      try {
        return desugar('(' + src + ')');
      } catch(e) {
        return desugar(src);
      }
    }
    return function(expected, actual, description) {
      return compareSource(desugarLoose(expected), desugarLoose(actual), description);
    };
  },
};

// Make hooks
for (var ii in hooks) {
  if (this[ii] && !this['hooked' + ii]) {
    this['hooked' + ii] = true;
    this[ii] = hooks[ii](this[ii]);
  }
}

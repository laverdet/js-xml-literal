// This file is run in global scope after every script.

// Print w/ new line
function print(str) {
  require('util').print(str+'\n');
}

// Hook reportCompare to handle XML
if (this.reportCompare && !this.reportCompareHooked) {
  reportCompareHooked = true;
  reportCompare = function(reportCompare) {
    return function(expected, actual, description) {
      if (expected instanceof XML && actual instanceof XML) {
        return reportCompare(true, XML(expected) == XML(actual), description);
      } else {
        return reportCompare(expected, actual, description);
      }
    };
  }(reportCompare);
}

// Hook compareSource to desugar both sources first
if (this.compareSource && !this.compareSourceHooked) {
  compareSourceHooked = true;
  compareSource = function(compareSource) {
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
  }(compareSource);
}

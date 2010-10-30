this.parseXML = parseXML;

/**
 * Yet another XML parser for JavaScript. This parser is rather watered down and doesn't enforce
 * much consistency in the document. This is intentional, as ctorElement will handle namespaces,
 * tag matching, and so on for us.
 */

// Scans an XML string for a tag name and returns the name
var scanName = function() {
  var nameChars = {
    '-': true,
    '_': true,
  };
  var nameCharsStart = {
    '_': true,
  };
  function addRanges(obj, ranges) {
    for (var ii = 0; ii < ranges.length; ii += 2) {
      for (var jj = ranges.charCodeAt(ii); jj <= ranges.charCodeAt(ii + 1); ++jj) {
        obj[String.fromCharCode(jj)] = true;
      }
    }
  }
  addRanges(nameChars, 'AZaz09');
  addRanges(nameCharsStart, 'AZaz');
  return function(xml, cursor) {
    var ii = cursor._;
    var jj = ii;
    if (!(xml[ii] in nameCharsStart)) {
      throw new SyntaxError('invalid xml name; position: ' + cursor._);
    }
    for (++ii; xml[ii] in nameChars; ++ii);
    if (xml[ii] === ':') {
      ++ii;
      if (!(xml[ii] in nameCharsStart)) {
        throw new SyntaxError('invalid xml name; position: ' + cursor._);
      }
      for (++ii; xml[ii] in nameChars; ++ii);
    }
    cursor._ = ii;
    return xml.substring(jj, ii);
  }
}();

var scanWhitespace = function() {
  var whitespace = {
    ' ': true,
    '\n': true,
    '\t': true,
  };
  return function(xml, cursor) {
    while (xml[cursor._] in whitespace) {
      ++cursor._;
    }
  }
}();

function scanPCData(xml, cursor, until) {
  var flush = ii = cursor._;
  var value = '';
  while (true) {
    if (xml[ii] === until) {
      // probably a < or a "
      break;
    } else if (xml[ii] === '&') {
      // entity
      if (flush !== ii) {
        value += xml.substring(flush, ii);
      }
      for (var jj = ii + 1; xml[jj] !== ';'; ++jj) {
        if (jj > ii + 8) {
          throw new SyntaxError('invalid entity; position: ' + ii);
        }
      }
      var entity = xml.substring(ii + 1, jj);
      if (entity === 'amp') {
        value += '&';
      } else if (entity === 'lt') {
        value += '<';
      } else if (entity === 'gt') {
        value += '>';
      } else if (entity === 'quot') {
        value += '"';
      } else if (entity === 'apos') {
        value += "'";
      } else if (entity[0] === '#') {
        var radix, regex;
        if (entity[1] === 'x') {
          regex = /^#[xX]([a-fA-F0-9]+)$/;
          radix = 16;
        } else {
          regex = /^#([0-9]+)$/;
          radix = 10;
        }
        entity = (regex.exec(entity) || [])[1];
        if (entity === undefined) {
          throw new SyntaxError('invalid entity; position: ' + ii);
        }
        var charCode = parseInt(entity, radix);
        value += String.fromCharCode(charCode);
      } else {
        throw new SyntaxError('invalid entity; position: ' + ii);
      }
      flush = ii = jj + 1;
    } else if (ii < xml.length) {
      ++ii;
    } else {
      break;
    }
  }
  if (flush !== ii) {
    value += xml.substring(flush, ii);
  }
  cursor._ = ii;
  return value;
}

function parseXML(xml) {
  var cursor = {_: 0};
  var desc = parseXMLHelper(xml, cursor);
  scanWhitespace(xml, cursor);
  if (cursor._ !== xml.length) {
    throw new SyntaxError('did not parse whole stream; position ' + cursor._);
  }
  return desc;
}

function parseXMLHelper(xml, cursor) {
  if (xml[cursor._] === '<') {
    // parse xml tag name
    ++cursor._;
    var name = scanName(xml, cursor);
    scanWhitespace(xml, cursor);

    // parse attributes
    var keys = [];
    var vals = [];
    while (xml[cursor._] !== '>' && xml[cursor._] !== '/') {
      keys.push(scanName(xml, cursor));
      scanWhitespace(xml, cursor);
      if (xml[cursor._] !== '=') {
        throw new SyntaxError('expecting =; position: ' + cursor._);
      }
      ++cursor._;
      if (xml[cursor._] === '"') {
        ++cursor._;
        vals.push(scanPCData(xml, cursor, '"'));
      } else if (xml[cursor._] === "'") {
        ++cursor._;
        vals.push(scanPCData(xml, cursor, "'"));
      } else {
        throw new SyntaxError('expecting \' or "; position: ' + cursor._);
      }
      ++cursor._;
      scanWhitespace(xml, cursor);
    }

    if (xml[cursor._] !== '/') {
      // end of the start
      if (xml[cursor._] !== '>') {
        throw new SyntaxError('expecting > or />; position: ' + cursor._);
      }
      ++cursor._;

      // parse children
      var children = [];
      while (xml[cursor._] !== '<' || xml[cursor._ + 1] !== '/') {
        if (cursor._ >= xml.length) {
          throw new SyntaxError('expecting close tag; position: ' + cursor._);
        }
        children.push(parseXMLHelper(xml, cursor));
      }

      // parse close tag
      cursor._ += 2;
      var closeName = scanName(xml, cursor);
      if (xml[cursor._] !== '>') {
        throw new SyntaxError('expecting >; position: ' + cursor._);
      }
      ++cursor._;
    } else if (xml[cursor._ + 1] === '>') {
      // singleton
      cursor._ += 2;
    } else {
      throw new SyntaxError('expecting > or />; position: ' + cursor._);
    }

    // descriptor
    return {
      type: 1,
      open: name,
      close: closeName,
      attributes: keys.length ? {keys: keys, vals: vals} : void 0,
      content: children,
    };
  } else {
    // just some pcdata
    return {
      type: 2,
      value: scanPCData(xml, cursor, '<'),
    };
  }
}

this.XML = XML;
var util = require('./util');
var extend = util.extend,
    parseXML = require('./parser').parseXML,
    ctorElement = require('./literal-ctor').ctorElement;

/**
 * XML is the base class for all XML literals. XMLChild and XMLList inherit from this class. It
 * will also be exposed to the global namespace.
 */
function XML(value) {
  if (value === null || value === undefined) {
    value = '';
  }
  if (value instanceof XML) {
    // Return deep copy if this is called as a constructor, and no copy if it's called as a
    // function. See 13.4.1 and 13.4.2
    return this instanceof XML ? value._deepCopy() : value;
  } else {
    return ctorElement(parseXML(xml));
  }
}

extend(null, XML, {
  // 13.4.4.39 XML.prototype.toXMLString ()
  toXMLString: function() {
    return this._toXMLString({'': ''}, 0);
  },
});

XML.ignoreComments = true;
XML.ignoreProcessingInstructions = true;
XML.ignoreWhitespace = true;
XML.prettyPrinting = true;
XML.prettyIndent = 2;

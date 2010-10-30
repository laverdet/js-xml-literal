this.XMLText = XMLText;
var extend = require('./util').extend,
    escapeElementValue = require('./etc').escapeElementValue,
    XML = require('./xml').XML,
    XMLChild = require('./xml-child').XMLChild;

function XMLText(value) {
  this._value = value;
}
extend(XMLChild, XMLText, {
  // 9.1.1.9 [[Equals]] (V)
  _equals: function(v) {
    if (!(v instanceof XMLText)) {
      return false;
    }

    // Check value
    if (this._value !== v._value) {
      return false;
    }
    return true;
  },

  // 10.2.1 ToXMLString Applied to the XML Type; #4
  _toXMLString: function(namespace, indentLevel) {
    if (XML.prettyPrinting) {
      return this._indentString(indentLevel) +
        escapeElementValue(this._value.replace(/^[ \r\n\t]+|[ \r\n\t]+$/g, ''));
    } else {
      return escapeElementValue(this._value);
    }
  },
});

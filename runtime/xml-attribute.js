this.XMLAttribute = XMLAttribute;
var util = require('./util'), etc = require('./etc'), xmlChild = require('./xml-child');
var extend = require('./util').extend,
    escapeAttributeValue = require('./etc').escapeAttributeValue,
    XMLChild = require('./xml-child').XMLChild;

function XMLAttribute(name, value) {
  this._name = name;
  this._value = value;
}
extend(XMLChild, XMLAttribute, {
  // 9.1.1.9 [[Equals]] (V)
  _equals: function(v) {
    if (!(v instanceof XMLAttribute)) {
      return false;
    }

    // Check name
    if (this._name) {
      if (!v._name ||
          this._name.localName != v._name.localName ||
          this._name.uri != v._name.uri) {
        return false;
      }
    } else if (v._name) {
      return false;
    }

    // Check value
    if (this._value !== v._value) {
      return false;
    }
    return true;
  },

  // 10.2.1 ToXMLString Applied to the XML Type; #5
  _toXMLString: function() {
    return escapeAttributeValue(this._value);
  },
});

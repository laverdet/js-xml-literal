this.XMLChild = XMLChild;
var util = require('./util');
var extend = util.extend, toString = util.toString,
    AttributeName = require('./attribute-name').AttributeName,
    toXMLName = require('./etc').toXMLName,
    XML = require('./xml').XML,
    XMLElement = require('./xml-element').XMLElement,
    XMLList = require('./xml-list').XMLList;

/**
 * 9.1 The XML Type
 *
 * XMLChild represents the `XML` type in ECMA-357. The internal [[Class]] property is represented
 * by subclasses of this class. No direct instances of XMLChild may be created.
 */
function XMLChild() {}
extend(XML, XMLChild, {
  // 10.2.1 ToXMLString Applied to the XML Type; #3
  _indentString: function(level) {
    var s = '';
    while (level--) {
      s += ' ';
    }
    return s;
  },

  // 9.1.1.1 [[Get]]
  _get: function(name) {
    var val = +name;
    if (val.toString() == name) {
      // a. Let list = ToXMLList(x)
      // b. Return the result of calling the [[Get]] method of list with argument P
      // This has the effect of the below:
      return val === 0 ? this : undefined;
    }
    name = toXMLName(name);
    var children = [];
    var list = new (XMLList._ctor)(this, name, children);
    
    if (name instanceof AttributeName) {
      // TODO: _attributes is an object keyed by uri and localName, this can be optimized
      // very easily.
      for (var uri in this._attributes) {
        if (name.uri === null || name.uri === uri) {
          for (var key in this._attributes[uri]) {
            if (name.localName === key || name.localName === '*') {
              children.push(this._attributes[uri][key]);
            }
          }
        }
      }
    } else {
      for (var ii = 0; ii < this._content.length; ++ii) {
        if ((name.localName === '*' ||
              (this._content[ii] instanceof XMLElement &&
              this._content[ii]._name.localName === name.localName)) &&
            (name.uri === null ||
              (this._content[ii] instanceof XMLElement &&
              this._content[ii]._name.uri === name.uri))) {
          children.push(this._content[ii]);
        }
      }
    }
    return list;
  },

  // 9.1.1.2 [[Put]]
  _put: function(name) {
    if ((+name).toString() == name) {
      throw new TypeError('this operation is reserved for future versions of E4X');
    }
    // continued in XMLElement
  },

  // 9.1.1.10 [[ResolveValue]] ()
  _resolveValue: function() {
    return this;
  },
});

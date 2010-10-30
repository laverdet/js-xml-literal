this.XMLElement = XMLElement;
var util = require('./util'), etc = require('./etc');
var extend = util.extend, toString = util.toString, beget = util.beget,
    AttributeName = require('./attribute-name').AttributeName,
    toXMLName = etc.toXMLName, escapeAttributeValue = etc.escapeAttributeValue,
    XML = require('./xml').XML,
    XMLAttribute = require('./xml-attribute').XMLAttribute,
    XMLChild = require('./xml-child').XMLChild,
    XMLText = require('./xml-text').XMLText,
    XMLList = require('./xml-list').XMLList;

function XMLElement(name, attributes, content, localNamespaces) {
  this._name = name;
  this._attributes = attributes;
  this._content = content;
  if (localNamespaces) {
    this._localNamespaces = localNamespaces;
  }
}
extend(XMLChild, XMLElement, {
  // 9.1.1.2 [[Put]]
  _put: function(name, vector) {
    XMLChild.prototype._put.call(this, name);
    if (vector instanceof XML) {
      vector = vector._deepCopy();
    } else {
      vector = toString(vector);
    }
    name = toXMLName(name);
    if (name instanceof AttributeName) {
      if (!isXMLName(name.localName)) {
        return;
      }
      if (vector instanceof XMLList) {
        if (vector._content.length === 0) {
          vector = '';
        } else {
          var s = toString(vector._content[0]);
          for (var ii = 1; ii < vector._content.length; ++ii) {
            s += ' ' + vector._content[ii]
          }
          vector = s;
        }
      } else {
        vector = toString(vector);
      }
      var attr = null;
      for (var uri in this._attributes) {
        if (name.uri === null || name.uri === uri) {
          if (name.localName in this._attributes[uri]) {
            if (attr === null) {
              attr = this._attributes[uri][name.localName];
            } else {
              delete this._attributes[uri][name.localName];
            }
          }
        }
      }
      if (attr === null) {
        if (name.uri === null) {
          var nons = new Namespace();
          name = new QName(nons, name.localName);
        } else {
          name = new QName(name.localName);
        }
        if (!(name.uri in this._attributes)) {
          this._attributes[name.uri] = {};
        }
        this._attributes[name.uri][name.localName] = new XMLAttribute(name, vector);
        this._addInScopeNamespace(name.uri);
      } else {
        attr.value = vector;
      }
    } else {
      if (!isXMLName(name.localName) && name.localName !== '*') {
        return;
      }
      var node = null;
      for (var ii = this._content.length - 1; ii >= 0; --ii) {
        if ((name.localName === '*' ||
              (this._content[ii] instanceof XMLElement &&
              this._content[ii]._name.localName == name.localName)) &&
            (name.uri === null ||
              (this._content[ii] instanceof XMLElement &&
              this._content[ii]._name.uri === name.uri))) {
          if (node !== null) {
            delete this._content[node]._parent;
            this._content.splice(node, 1);
          }
          node = ii;
        }
      }
      if (vector instanceof XML) {
        if (node === null) {
          vector._parent = this;
          this._content.push(vector);
        } else {
          delete this._content[node]._parent;
          this._childen[node] = vector;
        }
      } else {
        if (node === null) {
          node = this._content.length;
          if (name.uri === null) {
            name = new QName(globalNamespace[''], name.localName);
          }
          var el = new XMLElement(name, {}, []);
          el._parent = this;
          this._content.push(el);
        } else {
          for (var ii = 0; ii < this._content[node]._content.length; ++ii) {
            delete this._content[node]._content[ii]._parent;
          }
          this._content[node]._content = [];
        }
        this._content[node]._content.push(el = new XMLText(vector));
        el._parent = this;
      }
    }
  },

  // 9.1.1.7 [[DeepCopy]] ()
  _deepCopy: function() {
    // TODO: Significant performance improvements could be achieved by making this copy on write.
    var attributes = {};
    for (var uri in this._attributes) {
      attributes[uri] = {};
      for (var key in this._attributes[uri]) {
        attributes[uri][key] = this._attributes[uri][key]._deepCopy();
      }
    }
    var content = [];
    for (var ii = 0; this._content.length; ++ii) {
      content.push(this._content[ii]._deepCopy());
    }
    var localNamespaces;
    if (this._localNamespaces) {
      localNamespaces = this._localNamespaces.slice();
    }
    var copy = new XMLElement(this._name._copy(), attributes, content, localNamespaces);
    for (var uri in attributes) {
      for (var key in attributes) {
        attributes[uri][key]._parent = copy;
      }
    }
    for (var ii = 0; ii < content.length; ++ii) {
      content[ii]._parent = copy;
    }
    return copy;
  },

  // 9.1.1.9 [[Equals]] (V)
  _equals: function(v) {
    if (!(v instanceof XMLElement)) {
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

    // Check attributes
    for (var uri in this._attributes) {
      if (!(uri in v._attributes)) {
        return false;
      }
      for (var key in this._attributes[uri]) {
        if (!(key in v._attributes[uri]) ||
            this._attributes[uri][key]._value !== v._attributes[uri][key]._value) {
          return false;
        }
      }
      for (key in v._attributes[uri]) {
        if (!(key in this._attributes[uri])) {
          return false;
        }
      }
    }
    for (uri in v._attributes) {
      if (!(uri in this._attributes)) {
        return false;
      }
    }

    // Check children
    if (this._content.length != v._content.length) {
      for (var ii = 0; ii < this._content.length; ++ii) {
        if (!this._content[ii]._equals(v._content[ii])) {
          return false;
        }
      }
    }
    return true;
  },

  // 10.2.1 ToXMLString Applied to the XML Type; #8 - ...
  _toXMLString: function(namespaces, indentLevel) {
    var s = XML.prettyPrinting ? this._indentString(indentLevel) : '';

    // scan namespaces
    var scopeNamespaces = namespaces;
    if (this._localNamespaces) {
      scopeNamespaces = beget(scopeNamespaces);
      for (var ii = 0; ii < this._localNamespaces.length; ++ii) {
        scopeNamespaces[this._localNamespaces[ii].uri] = this._localNamespaces[ii].prefix;
      }
    }

    // render tag name
    s += '<';
    if (scopeNamespaces[this._name.uri] !== '') {
      s += scopeNamespaces[this._name.uri] + ':';
    }
    s += this._name.localName;

    // render attributes
    var prefix;
    for (var uri in this._attributes) {
      prefix = scopeNamespaces[uri] === '' ? '' : scopeNamespaces[uri] + ':';
      for (var key in this._attributes[uri]) {
        s += ' ' + key + '="' + escapeAttributeValue(this._attributes[uri][key]._value) + '"';
      }
    }

    // render namespaces
    if (this._localNamespaces) {
      for (var ii = 0; ii < this._localNamespaces.length; ++ii) {
        if (scopeNamespaces[this._localNamespaces[ii].uri] ===
            namespaces[this._localNamespaces[ii].uri]) {
          continue;
        }
        if (scopeNamespaces[this._localNamespaces[ii].uri] === '') {
          s += ' xmlns="' + escapeAttributeValue(this._localNamespaces[ii].uri) + '"';
        } else {
          s +=
            ' xmlns:' + scopeNamespaces[this._localNamespaces[ii].uri] + '="' +
            escapeAttributeValue(this._localNamespaces[ii].uri) + '"';
        }
      }
    }

    // render content
    if (this._content.length === 0) {
      s += '/>';
      return s;
    }
    s += '>';
    var indentChildren = XML.prettyPrinting && (this._content.length > 1 || this._content[0] instanceof XMLText);
    var nextIndentLevel = indentChildren ? indentLevel + XML.prettyIndent : 0;
    for (var ii = 0; ii < this._content.length; ++ii) {
      if (indentChildren) {
        s += '\n';
      }
      s += this._content[ii]._toXMLString(scopeNamespaces, nextIndentLevel);
    }
    if (indentChildren) {
      s += '\n' + this._indentString(indentLevel);
    }
    s += '</';
    if (scopeNamespaces[this._name.uri] !== '') {
      s += scopeNamespaces[this._name.uri] + ':';
    }
    s += this._name.localName + '>';
    return s;
  },
});

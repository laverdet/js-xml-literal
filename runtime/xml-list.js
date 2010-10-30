this.XMLList = XMLList;
var util = require('./util');
var extend = util.extend,
    XML = require('./xml').XML,
    XMLElement = require('./xml-element').XMLElement,
    AttributeName = require('./attribute-name').AttributeName;

function XMLList() {}
extend(XML, XMLList, {
  // 9.2.1.1 [[Get]] (P)
  _get: function(name) {
    var val = +name;
    if (val.toString() == name) {
      return this._content[val];
    }
    var elements = [];
    var list = new (XMLList._ctor)(this, name, elements);
    for (var ii = 0; ii < this._content.length; ++ii) {
      if (this._content[ii] instanceof XMLElement) {
        elements.push.apply(elements, this._content[ii]._get(name)._content);
      }
    }
    return list;
  },

  // 9.2.1.2 [[Put]] (P, V)
  _put: function(name, vector) {
    var val = +name;
    if (val.toString() == name) {
      var resolved;
      if (this._targetObject !== null) {
        resolved = this._targetObject._resolveValue();
        if (resolved === null) {
          return;
        }
      } else {
        resolved = null;
      }
      if (val >= this._content.length) {
        if (resolved instanceof XMLList) {
          if (resolved._content.length !== 1) {
            return;
          }
          resolved = resolved[0];
        }
        if (!(resolved instanceof XMLElement)) {
          return;
        }
        var el;
        if (this._targetProperty instanceof AttributeName) {
          el = new XMLAttribute(this._targetProperty);
        } else if (this._targetProperty === null || this._targetProperty.localName === '*') {
          el = new XMLText;
        } else {
          el = new XMLElement(this._targetProperty, {}, []);
        }
        el._parent = resolved;
        if (!(el instanceof XMLAttribute)) {
          var ii = this._content.length;
          var jj;
          if (ii > 0) {
            jj = 0;
            while (jj < resolved._content.length - 1 &&
                resolved._content[jj] !== this[ii - 1]) {
              ++jj;
            }
          } else {
            jj = resolved._content.length - 1;
          }
          resolved._content.splice(jj, 0, el);
          if (vector instanceof XMLList) {
            el._name = vector._targetProperty;
          } else if (vector instanceof XML) {
            el._name = vector._name;
          }
        }
        this._content.push(el);
      }
      if (!(vector instanceof XML) ||
          vector instanceof XMLAttribute ||
          vector instanceof XMLText) {
        vector = toString(vector);
      }
      if (this._content[val] instanceof XMLAttribute) {
        var z = toAttributeName(this._content[val]._name);
        this._content[val]._parent._put(z, vector);
        var attr = this._content[val]._parent._get(z);
        this._content[val] = attr._get(0);
      } else if (vector instanceof XMLList) {
        var parent = this._content[ii]._parent;
        if (parent !== null) {
          var q = 0;
          while (true) {
            if (parent._content[q] === this._content[val]) {
              break;
            }
            if (++q > parent._content.length) {
              throw new Error('9.2.1.2 [[Put]] (P, V): 2.f.iii.1');
            }
          }
          delete parent._content[q]._parent;
          Array.splice.apply(parent._content, [q, 1].concat(this._content));
          // ohhhhhhhh myyyyyyy goddddd
          // 2.f.iii.3
        }
      } else if (vector instanceof XML) {
        var parent = this._content[val]._parent;
        if (parent !== null) {
          var q = 0;
          while (true) {
            if (parent._content[q] === this._content[val]) {
              break;
            }
            if (++q > parent._content.length) {
              throw new Error('9.2.1.2 [[Put]] (P, V): 2.q.ii.1');
            }
          }
          delete parent._content[q]._parent;
          parent._content[q] = vector;
          vector._parent = parent;
        }
        if (typeof vector == 'string') {
          this._content[val] = new XMLText(vector);
          this._content[val]._parent = this;
        } else {
          this._content[val] = vector;
        }
      } else {
        this._content[val]._put('*', vector);
      }
    } else if (this._content.length <= 1) {
      if (this._content.length === 0) {
        var resolved = this._resolveValue();
        if (resolved === null || resolved._content.length !== 1) {
          return;
        }
        this._content.push(resolved);
      }
      this._content[0]._put(name, vector);
    }
  },

  // 9.2.1.9 [[Equals]] (V)
  _equals: function(v) {
    if (v === undefined) {
      return !this._content.length;
    } else if (v instanceof XMLList) {
      if (this._content.length !== v._content.length) {
        return false;
      }
      for (var ii = 0; ii < this._content.length; ++ii) {
        if (!this._content[ii]._equals(v._content[ii])) {
          return false;
        }
      }
      return true;
    } else if (this._content.length === 1) {
      return this._content[0]._equals(v);
    } else {
      return true;
    }
  },

  // 9.2.1.10 [[ResolveValue]] ()
  _resolveValue: function() {
    if (this._content.length) {
      return this;
    }
    if (this._targetObject === null || this._targetProperty === null ||
        this._targetProperty instanceof AttributeName || this._targetProperty.localName === '*') {
      return null;
    }
    var base = this._targetObject._resolveValue();
    if (base === null) {
      return null;
    }
    var target = base._get(this._targetProperty);
    if (target._content.length === 0) {
      if (base instanceof XMLList && base._content.length > 1) {
        return null;
      }
      base._put(this._targetProperty, '');
      target = base._get(this._targetProperty);
    }
    return target;
  },

  // 10.2.2 ToXMLString Applied to the XMLList Type
  _toXMLString: function(namespaces, indentLevel) {
    var ret = '';
    for (var ii = 0; ii < this._content.length; ++ii) {
      if (ii && XML.prettyPrinting) {
        ret += '\n';
      }
      ret += this._content[ii]._toXMLString({'': ''}, 0);
    }
    return ret;
  },

});

XMLList._ctor = extend(XMLList, function(targetObject, targetProperty, elements) {
  this._targetObject = targetObject;
  this._targetProperty = targetProperty;
  this._content = elements;
});

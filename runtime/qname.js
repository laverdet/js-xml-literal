this.QName = QName;
var util = require('./util');
var extend = util.extend, toString = util.toString, setFinalProperty = util.setFinalProperty,
    getDefaultNamespace = require('./default-namespace').getDefaultNamespace,
    Namespace = require('./namespace').Namespace;

/**
 * 13.3 QName Objects
 *
 * QName objects are used to represent qualified names of XML elements and attributes. Each QName
 * object has a local name of type string and a namespace URI of type string or null. When the
 * namespace URI is null, this qualified name matches any namespace.
 *
 * A value of type QName may be specified using a `QualifiedIdentifier`. If the QName of an XML
 * element is specified without identifying a namespace (i.e., as an unqualified identifier), the
 * uri property of the associated QName will be set to the in-scope default namespace (section
 * 12.1). If the QName of an XML attribute is specified without identifying a namespace, the uri
 * property of the associated QName will be the empty string representing no namespace.
 *
 * The value of the localName property is a value of type string. When the value of the localName
 * property is "*" it represents a wildcard that matches any name.
 *
 * The value of the uri property is null or a value of type string identifying the namespace of
 * this QName. When the value of the uri property is the empty string, this QName is said to be
 * in no namespace. No namespace is used in XML objects to explicitly specify that a name is not
 * inside a namespace. When the value of the uri property is null, this QName will match names
 * in any namespace.
 *
 * QName()
 * QName(name)
 * QName(namespace, name)
 */
function QName(arg1, arg2) {
  if (this instanceof QName) {
    // 13.3.2 The QName Constructor
    var name, namespace;
    if (arguments.length === 1) {
      name = arg1;
    } else if (arguments.length >= 2) {
      name = arg2;
      namespace = arg1;
    }
    if (name instanceof QName) {
      if (arguments.length === 1) {
        // If name is a QName and namespace is not specified, the QName constructor returns a copy
        // of the given name.
        return name._copy();
      }
      name = name.localName;
    }
    if (name === undefined) {
      // If name is undefined or not specified, then the empty string is used as the name.
      name = '';
    } else {
      name = toString(name);
    }
    if (namespace === undefined) {
      if (name === '*') {
        namespace = null;
      } else {
        namespace = getDefaultNamespace();
      }
    }
    setFinalProperty(this, 'localName', name);
    if (namespace === null) {
      // If the namespace argument is null, the uri property of the newly created object will be
      // null, meaning it will match names in any namespace.
      setFinalProperty(this, 'uri', null);
    } else {
      namespace = new Namespace(namespace);
      setFinalProperty(this, 'uri', namespace.uri)
    }
  } else {
    // 13.3.1 The QName Constructor Called as a Function
    // If the QName constructor is called as a function with exactly one argument that is a QName
    // object, the argument is returned unchanged. Otherwise, a new QName object is created and
    // returned as if the same arguments were passed to the object relation expression
    // new QName (...). See section 13.3.2.
    if (arguments.length === 1) {
      return arg1 instanceof QName ? arg1 : new QName(arg1);
    } else if (arguments.length === 0) {
      return new QName;
    } else {
      return new QName(arg1, arg2);
    }
  }
}
extend(null, QName, {
  // 13.3.4.2 QName.prototype.toString()
  toString: function() {
    if (this instanceof QName) {
      var s = '';
      if (this.uri !== '') {
        s = this.uri === null ? '*::' : this.uri + '::';
      }
      return s + this.localName;
    } else {
      throw new TypeError;
    }
  },

  // 13.3.5.4 [[GetNamespace]] ([InScopeNamespaces])
  _getNamespace: function(inScopeNamespaces) {
    for (var ii in inScopeNamespaces) {
      if (inScopeNamespaces[ii].uri === this.uri) {
        return inScopeNamespaces[ii];
      }
    }
    return new Namespace(this.uri);
  },

  _copy: function() {
    return new QName(this.uri, this.localName);
  },
});

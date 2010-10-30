this.Namespace = Namespace;
var util = require('./util');
var extend = util.extend, toString = util.toString, setFinalProperty = util.setFinalProperty,
    isXMLName = require('./etc').isXMLName;

/**
 * 13.2 Namespace Objects
 *
 * Namespace objects represent XML namespaces and provide an association between a namespace prefix
 * and a Unique Resource Identifier (URI). The prefix is either the undefined value or a string
 * value that may be used to reference the namespace within the lexical representation of an XML
 * value. When an XML object containing a namespace with an undefined prefix is encoded as XML by
 * the method ToXMLString(), the implementation will automatically generate a prefix. The URI is a
 * string value used to uniquely identify the namespace.
 *
 * The value of the prefix property is either the undefined value or a string value. When the value
 * of the prefix property is the empty string, the Namespace is called a default namespace. Default
 * namespaces are used in XML objects to determine the namespace of names that do not specify a
 * qualifier.
 *
 * The value of the uri property is a string value. When the value of the uri property is the empty
 * string, the Namespace represents the unnamed namespace. The unnamed namespace is used in XML
 * objects to explicitly specify that a name is not inside a namespace.
 *
 * Namespace()
 * Namespace(uriValue)
 * Namespace(prefixValue, uriValue)
 */
function Namespace(arg1, arg2) {
  if (this instanceof Namespace) {
    // 13.2.2 The Namespace Constructor
    var prefixValue, uriValue;
    if (arguments.length === 0) {
      // When no arguments are specified, the namespace uri and the prefix are set to the empty
      // string. A namespace with uri set to the empty string represents no namespace. No namespace
      // is used in XML objects to explicitly specify that a name is not inside a namespace and may
      //never be associated with a prefix other than the empty string.
      prefixValue = uriValue = '';
    } else if (arguments.length === 1) {
      uriValue = arg1;
      if (uriValue instanceof Namespace) {
        // When only the uriValue argument is specified and uriValue is a Namespace object, a copy
        // of the uriValue is returned.
        prefixValue = uriValue.prefix;
        uriValue = uriValue.uri;
      } else if (uriValue instanceof QName && uriValue.uri !== null) {
        uriValue = uriValue.uri;
      } else {
        uriValue = toString(uriValue);
        if (uriValue === '') {
          // When only the uriValue is specified and it is the empty string, the prefix is set to
          // the empty string. In all other cases where only the uriValue is specified, the
          // namespace prefix is set to the undefined value.
          prefixValue = '';
        }
      }
    } else {
      uriValue = arg2;
      prefixValue = arg1;
      // When the prefixValue argument is specified and set to the empty string, the Namespace
      // is called a default namespace. Default namespaces are used in XML objects to implicitly
      // specify the namespace of qualified names that do not specify a qualifier.
      if (uriValue instanceof QName && uriValue.uri !== null) {
        uriValue = uriValue.uri;
      } else {
        uriValue = toString(uriValue);
      }
      if (uriValue === '') {
        if (prefixValue === undefined || toString(prefixValue) === '') {
          prefixValue = '';
        } else {
          throw new TypeError;
        }
      } else if (prefixValue !== undefined) {
        if  (isXMLName(prefixValue)) {
          prefixValue = toString(prefixValue);
        } else {
          prefixValue = undefined;
        }
      }
    }
    setFinalProperty(this, 'prefix', prefixValue);
    setFinalProperty(this, 'uri', uriValue);
  } else {
    // 13.2.1 The Namespace Constructor Called as a Function
    // If the Namespace constructor is called as a function with exactly one argument that is a
    // Namespace object, the argument is returned unchanged. Otherwise, a new Namespace object is
    // created and returned as if the same arguments were passed to the object creation expression
    // new Namespace (...). See section 13.2.2.
    if (arguments.length === 1) {
      return arg1 instanceof Namespace ? arg1 : new Namespace(arg1);
    } else if (arguments.length === 0) {
      return new Namespace;
    } else {
      return new Namespace(arg1, arg2);
    }
  }
}
extend(null, Namespace, {
  // 13.2.4.2 Namespace.prototype.toString()
  toString: function() {
    if (this instanceof Namespace) {
      return this.uri;
    } else {
      throw new TypeError;
    }
  },
});

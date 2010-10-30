/**
 * General utilities used throughout the runtime. These are not mentioned in ECMA-357, they are
 * just random functions which help with the implementation details.
 */
this.extend = extend;
this.toString = toString;
this.setFinalProperty = setFinalProperty;
this.beget = beget;
this.parseXMLName = parseXMLName;

/**
 * Extends a function via simple prototype chain.
 */
function extend(base, derived, proto) {
  if (base) {
    function F() {}
    F.prototype = base.prototype;
    derived.prototype = new F;
  }
  for (var ii in proto) {
    derived.prototype[ii] = proto[ii];
  }
  return derived;
}

/**
 * Convert argument to a string. Seems faster than `expr + ''`
 */
function toString(expr) {
  if (typeof expr === 'string') {
    return expr;
  } else if (expr === undefined) {
    return 'undefined';
  } else if (expr === null) {
    return 'null';
  }
  expr = expr.toString();
  if (typeof expr === 'string') {
    return expr;
  } else {
    throw new TypeError('can\'t convert expression to string');
  }
}

/**
 * Sets a property with ReadOnly, DontDelete
 */
function setFinalProperty(obj, key, val) {
  Object.defineProperty(obj, key, {
    value: val,
    writable: false,
    configurable: false,
    enumerable: true,
  });
}

/**
 * Return a begotten object
 */
function beget(obj) {
  function F(){}
  F.prototype = obj;
  return new F;
}

/**
 * Parses XML tag name and returns [..., <namespace>, <name]
 */
function parseXMLName(name) {
  var ret = /^(?:([a-zA-Z_][a-zA-Z0-9_.\-]*):)?([a-zA-Z_][a-zA-Z0-9_.\-]*)$/.exec(name);
  if (!ret) {
    throw new SyntaxError('illegal XML name ' + name);
  }
  return ret;
}

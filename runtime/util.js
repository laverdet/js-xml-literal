this.extend = extend;
this.toString = toString;
this.beget = beget;
this.defineProperties = defineProperties;
this.defineGetters = defineGetters;

/**
 * Extends a function via simple prototype chain.
 */
function extend(derived, base) {
  function F() {}
  F.prototype = base.prototype;
  derived.prototype = new F;
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
 * Return a begotten object
 */
function beget(obj) {
  function F(){}
  F.prototype = obj;
  return new F;
}

/**
 * Defines properties on an object.
 */
function defineProperties(obj, properties) {
  for (var ii in properties) {
    obj[ii] = properties[ii];
  }
}

/**
 * Defines a list of getters on an object.
 */
function defineGetters(obj, getters) {
  for (var ii in getters) {
    Object.defineProperty(obj, ii, {
      get: getters[ii],
      enumerable: true,
    });
  }
}

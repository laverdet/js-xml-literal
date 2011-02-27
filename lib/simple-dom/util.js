this.extend = extend;
this.beget = beget;
this.sealConstructor = sealConstructor;
this.defineProperties = defineProperties;
this.defineGetters = defineGetters;
this.nodeIndex = nodeIndex;
this.stealFragmentChildren = stealFragmentChildren;
this.escapeElementValue = escapeElementValue;
this.escapeAttributeValue = escapeAttributeValue;
this.ToString = ToString;

/**
 * Extends a function via simple prototype chain.
 */
function extend(derived, base) {
  derived.prototype = beget(base.prototype);
  return derived;
}

/**
 * Returns a begotten object.
 */
function beget(obj) {
  function F() {}
  F.prototype = obj;
  return new F;
}

/**
 * Returns a Function which represents another constructor, except if you try to construct a new
 * object it will throw. `instanceof` and `prototype` will still work as they would with the
 * original constructor.
 */
function sealConstructor(ctor) {
  function F() {
    throw new TypeError('Illegal constructor');
  }
  F.fn = ctor.prototype;
  return F;
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

/**
 * Gets the index of a child with respect to its parent's childNodes
 */
function nodeIndex(parentNode, node) {
  var index = node.__.index;
  if (index === undefined || parentNode.__.childNodes[index] !== node) {
    if (index === -1) {
      return index;
    }
    return node.__.index = parentNode.__.childNodes.indexOf(node);
  }
  return index;
}

/**
 * Sets the parentNode of every element in a Fragment to some other node. Also resets the Fragment's
 * children to an empty array.
 */
function stealFragmentChildren(node, fragment) {
  for (var ii = fragment.__.childNodes.length; ii--; ) {
    fragment.__.childNodes[ii].__.parentNode = node;
  }
  fragment.__.childNodes = [];
}

function escapeElementValue(val) {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttributeValue(val) {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#xA;')
    .replace(/\r/g, '&#xD;')
    .replace(/\t/g, '&#x9;');
}

function ToString(expr) {
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

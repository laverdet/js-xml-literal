this.Element = Element;
this.ElementCtor = ElementCtor;
this.ElementData = ElementData;

var domUtil = require('./dom-util');
var util = require('./util');
var environment = require('./environment');
var nodeWithChildren = require('./node-with-children');

var escapeAttributeValue = domUtil.escapeAttributeValue;
var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var extend = util.extend;
var toString = util.toString;
var XMLEnvironment = environment.XMLEnvironment;
var NodeWithChildren = nodeWithChildren.NodeWithChildren;
var NodeWithChildrenData = nodeWithChildren.NodeWithChildrenData;

/** 
 * Creates a string of indentation 
 */ 
function indent(level) { 
  var buf = ''; 
  while (level--) { 
    buf += '  '; 
  } 
  return buf; 
}

/**
 * `Element` node. Represents a named element.
 */
function Element() {
  NodeWithChildren.call(this); // throws
}
extend(Element, NodeWithChildren);

function ElementData(parentNode, nodeName, namespaceURI) {
  NodeWithChildrenData.call(this, parentNode);
  this.attributes = {};
  this.nodeName = nodeName;
  this.namespaceURI = namespaceURI;
}
extend(ElementData, NodeWithChildrenData);

function ElementCtor(parentNode, nodeName, namespaceURI) {
  Object.defineProperty(this, '__', {
    value: new ElementData(parentNode, nodeName, namespaceURI),
  });
}
ElementCtor.prototype = Element.prototype;

Object.defineProperty(Element.prototype, '_selfClosing', {
  value: true,
  configurable: true,
});

function elementToString(el, pretty, level) {
  // open tag
  var str = '<' + el.__.nodeName;

  // attributes
  for (var ii in el.__.attributes) {
    var val;
    if (el.__.attributes[ii] === true) {
      val = ii;
    } else if (el.__.attributes[ii] === false) {
      continue;
    } else {
      val = escapeAttributeValue(toString(el.__.attributes[ii]));
    }
    str += ' ' + ii + '="' + val + '"';
  }

  // self-closing tag with no children
  if (el._selfClosing && el.__.childNodes.length === 0) {
    return str + '/>';
  }
  str += '>';

  // children
  for (var ii = 0; ii < el.__.childNodes.length; ++ii) {
    if (pretty) {
      if (ii) {
        str += '\n';
      }
      str += indent(level + 1);
    }
    if (el.__.childNodes[ii] instanceof Element) {
      str += elementToString(el.__.childNodes[ii], pretty, level + 1);
    } else {
      str += el.__.childNodes[ii].toString();
    }
  }
  return str + '</' + el.__.nodeName + '>';
}

function normalizeName(name) {
  name = toString(name);
  if (!/^[A-Za-z_][A-Za-z_\-.0-9]*$/.test(name)) {
    throw new TypeError('XML name contains an invalid character');
  }
  return name.toLowerCase();
}

defineProperties(Element.prototype, {
  getAttribute: function(attr) {
    return this.__.attributes[normalizeName(attr)];
  },

  setAttribute: function(attr, val) {
    this.__.attributes[normalizeName(attr)] = val;
  },

  getAttributeNS: function(uri, attr) {
    uri = toString(uri);
    if (uri === '') {
      return this.getAttribute(attr);
    }
    if (!this.__.attributesNS) {
      this.__.attributesNS = {};
    }
    if (uri in this.__.attributesNS) {
      return this.__.attributesNS[uri][normalizeName(attr)];
    } else {
      return undefined;
    }
  },

  setAttributeNS: function(uri, attr, val) {
    uri = toString(uri);
    if (uri === '') {
      return this.setAttribute(attr, val);
    }
    if (!this.__.attributesNS) {
      this.__.attributesNS = {};
    }
    if (!(uri in this.__.attributesNS)) {
      this.__.attributesNS[uri] = {};
    }
    this.__.attributesNS[uri][normalizeName(attr)] = val;
  },

  toString: function() {
    return elementToString(this, XMLEnvironment.get().prettyPrint, 0);
  },
});

defineGetters(Element.prototype, {
  nodeName: function() {
    return this.__.nodeName;
  },

  namespaceURI: function() {
    return this.__.namespaceURI;
  },

  tagName: function() {
    return this.__.nodeName;
  },
});

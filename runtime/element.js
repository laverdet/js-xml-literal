this.Element = Element;
this.ElementCtor = ElementCtor;
this.ElementData = ElementData;

var util = require('./util');
var nodeWithChildren = require('./node-with-children');

var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var extend = util.extend;
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
  throw new Error;
}
extend(Element, NodeWithChildren);

function ElementData(parentNode, nodeName, namespaceURI) {
  NodeWithChildrenData.call(this, parentNode);
  this.nodeName = nodeName;
  this.namespaceURI = namespaceURI;
}
extend(ElementData, NodeWithChildrenData);

function ElementCtor(parentNode, nodeName, namespaceURI) {
  Object.defineProperty(this, '__', {
    value: new ElementData(parentNode, nodeName, namespaceURI),
    writeable: false,
    configurable: false,
    enumerable: false
  });
}
ElementCtor.prototype = Element.prototype;

defineProperties(Element.prototype, {
  getAttribute: function(attr) {
    return this[attr];
  },

  setAttribute: function(attr, val) {
    this[attr] = val;
  },

  getAttributeNS: function(uri, attr) {
  },

  setAttributeNS: function(uri, attr, val) {
  },

  toString: function(pretty, level) {
    var str = '<' + this.__.nodeName + '>';
    for (var ii = 0; ii < this.__.childNodes.length; ++ii) {
      if (pretty) {
        if (ii) {
          str += '\n';
        }
        str += indent(level + 1);
      }
      str += this.__.childNodes[ii].toString(pretty, level + 1);
    }
    str += '</' + this.__.nodeName + '>';
    return str;
  },
});

defineGetters(Element.prototype, {
  nodeName: function() {
    return this.__.nodeName;
  },

  namespaceURI: function() {
    return this.__.namespaceURI;
  },
});

// DOM Level 2 HTML; 1.6.2. Naming Exceptions 
Object.defineProperty(Element.prototype, 'className', {
  get: function(val) { this.class = val; },
  set: function() { return this.class; },
  configurable: false,
  enumerable: false,
});
Object.defineProperty(Element.prototype, 'forHtml', {
  get: function(val) { this.for = val; },
  set: function() { return this.for; },
  configurable: false,
  enumerable: false,
});

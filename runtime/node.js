this.Node = Node;
this.NodeData = NodeData;

var util = require('./util');
var domUtil = require('./dom-util');

var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var nodeIndex = domUtil.nodeIndex;
var NodeError = domUtil.NodeError;

/**
 * Base `Node` class. No direct instances of this will exist.
 */
function Node() {
  throw new Error;
}

function NodeData(parentNode) {
  this.parentNode = parentNode;
}

var stubs = [
  'insertBefore', 'replaceChild', 'removeChild', 'appendChild', 'hasChildNodes', 'cloneNode'
];
for (var ii in stubs) {
  Object.defineProperty(Node.prototype, stubs[ii], {
    value: function() { throw new NodeError; },
    writable: false,
    configurable: false,
    enumerable: false,
  });
}

var properties = [
  'nodeName', 'nodeValue', 'nodeType', 'childNodes', 'firstChild', 'lastChild', 'attributes',
  'namespaceURI'
];
for (var ii in properties) {
  Object.defineProperty(Node.prototype, properties[ii], {
    get: function() { return null; },
    configurable: false,
    enumerable: false,
  });
}

defineGetters(Node.prototype, {
  parentNode: function() {
    return this.__.parentNode;
  },

  previousSibling: function() {
    var parentNode = this.__.parentNode;
    if (!parentNode) {
      return null;
    }
    var index = nodeIndex(parentNode, this) - 1;
    if (index > 0) {
      var sibling = parentNode.__.childNodes[index];
      sibling.__.index = index;
      return sibling;
    } else {
      return null;
    }
  },

  nextSibling: function() {
    var parentNode = this.__.parentNode;
    if (!parentNode) {
      return null;
    }
    var index = nodeIndex(parentNode, this) + 1;
    if (index < parentNode.__.childNodes.length) {
      var sibling = parentNode.__.childNodes[index];
      sibling.__.index = index;
      return sibling;
    } else {
      return null;
    }
  },
});

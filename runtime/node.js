this.Node = Node;
this.NodeData = NodeData;

var util = require('./util');
var domUtil = require('./dom-util');

var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var nodeIndex = domUtil.nodeIndex;

/**
 * Abstract `Node` class.
 */
function Node() {
  throw new TypeError('Illegal constructor');
}

function NodeData(parentNode) {
  this.parentNode = parentNode;
}

var stubs = [
  'insertBefore', 'replaceChild', 'removeChild', 'appendChild', 'hasChildNodes', 'cloneNode'
];
for (var ii in stubs) {
  Node.prototype[ii] = function() { throw new Error; };
}

var properties = [
  'nodeName', 'nodeValue', 'nodeType', 'childNodes', 'firstChild', 'lastChild', 'attributes',
  'namespaceURI'
];
for (var ii in properties) {
  Object.defineProperty(Node.prototype, properties[ii], {
    get: function() { return null; },
    enumerable: true,
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

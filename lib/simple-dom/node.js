this.Node = Node;
this.NodeData = NodeData;

var util = require('./util');

var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var nodeIndex = util.nodeIndex;

/**
 * Abstract `Node` class.
 */
function Node() {
}

function NodeData() {
	this.parentNode = null;
}

var stubs = [
	'insertBefore', 'replaceChild', 'removeChild', 'appendChild', 'cloneNode'
];
for (var ii = 0; ii < stubs.length; ++ii) {
	Node.prototype[ii] = function() { throw new Error; };
}

Node.prototype.hasChildNodes = function() {
	return false;
}

var properties = [
	'nodeName', 'nodeValue', 'nodeType', 'childNodes', 'firstChild', 'lastChild', 'attributes',
	'namespaceURI'
];
for (var ii = 0; ii < properties.length; ++ii) {
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

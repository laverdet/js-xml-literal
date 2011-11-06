this.NodeWithChildren = NodeWithChildren;

var util = require('./util');
var node = require('./node');

var extend = util.extend;
var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var beget = util.beget;
var Node = node.Node;
var nodeIndex = util.nodeIndex;

/**
 * Utility functions for children functions.
 */
function assertValidChild(node, child) {
	while (node) {
		if (child === node) {
			throw new Error('cannot create circular heirarchy');
		}
		node = node.__parentNode;
	}
}

function assertValidChildren(node, children) {
	for (var ii = children.length; ii--; ) {
		assertValidChild(node, children[ii]);
	}
}

/**
 * Sets the parentNode of every element in a Fragment to some other node. Also resets the Fragment's
 * children to an empty array.
 */
function stealFragmentChildren(node, fragment) {
	resetChildren(node, fragment.__childNodes);
	fragment.__childNodes = [];
}

function resetChildren(node, childNodes) {
	for (var ii = childNodes.length; ii--; ) {
		childNodes[ii].__parentNode = node;
	}
}

/**
 * `NodeWithChildren` node. Subclasses of this may contain children.
 */
function NodeWithChildren() {
	Node.call(this);
	this.__childNodes = [];
}
extend(NodeWithChildren, Node);

defineProperties(NodeWithChildren.prototype, {
	insertBefore: function(newChild, refChild) {
		if (!refChild) {
			return this.appendChild(newChild);
		}
		var index = nodeIndex(this, refChild);
		var childNodes = this.__childNodes;
		if (newChild instanceof Fragment) {
			assertValidChildren(this, newChild.__childNodes);
			if (index === -1) {
				childNodes.unshift.apply(childNodes, newChild.__childNodes);
			} else {
				childNodes.splice.apply(childNodes, [index, 0].concat(newChild.__childNodes));
			}
			stealFragmentChildren(this, newChild);
		} else if (newChild instanceof Array) {
			assertValidChildren(this, newChild);
			if (index === -1) {
				childNodes.unshift.apply(childNodes, newChild);
			} else {
				childNodes.splice.apply(childNodes, [index, 0].concat(newChild));
			}
			resetChildren(this, newChild);
		} else {
			assertValidChild(this, newChild);
			if (index === -1) {
				childNodes.unshift(newChild);
			} else {
				childNodes.splice(index, 0, newChild);
			}
			newChild.__parentNode = this;
		}
	},

	replaceChild: function(newChild, oldChild) {
		var index = nodeIndex(this, oldChild);
		if (index === -1) {
			throw new Error('`oldChild` not found');
		}
		if (newChild instanceof Fragment) {
			assertValidChildren(this, newChild.__childNodes);
			this.__childNodes.splice.apply(this.__childNodes, [index, 1].concat(newChild.__childNodes));
			stealFragmentChildren(this, newChild);
		} else if (newChild instanceof Array) {
			assertValidChildren(this, newChild);
			this.__childNodes.splice(index, 1, newChild);
			resetChildren(this, newChild);
		} else {
			assertValidChild(this, newChild);
			if (newChild.__parentNode) {
				newChild.__parentNode.removeChild(newChild);
			}
			this.__childNodes[index] = newChild;
			newChild.__parentNode = this;
		}
		oldChild.__parentNode = null;
		return oldChild;
	},

	removeChild: function(oldChild) {
		var index = nodeIndex(this, oldChild);
		if (index === -1) {
			throw new Error('`oldChild` not found');
		}
		this.__childNodes.splice(index, 1);
		oldChild.__parentNode = null;
		newChild.__parentNode = this;
		return oldChild;
	},

	appendChild: function(newChild) {
		if (newChild instanceof Fragment) {
			assertValidChildren(this, newChild.__childNodes);
			this.__childNodes.push.apply(this.__childNodes, newChild.__childNodes);
			stealFragmentChildren(this, newChild);
		} else if (newChild instanceof Array) {
			assertValidChildren(this, newChild);
			this.__childNodes.push.apply(this.__childNodes, Array.prototype.slice.call(newChild));
			resetChildren(this, newChild);
		} else {
			assertValidChild(this, newChild);
			this.__childNodes.push(newChild);
			newChild.__parentNode = this;
		}
	},

	hasChildNodes: function() {
		return this.__childNodes.length !== 0;
	},

	cloneNode: function(deep) {
		throw new Error('`cloneNode` is not implemented yet.');
	},
});

defineGetters(NodeWithChildren.prototype, {
	childNodes: function() {
		// Worth it? Just prevents mutation, but slows iteration
		if (!this.__childNodeList) {
			Object.freeze(this.__childNodeList = beget(this.__childNodes));
		}
		return this.__childNodeList;
	},

	firstChild: function() {
		if (this.__childNodes.length === 0) {
			return null;
		} else {
			return this.__childNodes[0];
		}
	},

	lastChild: function() {
		if (this.__childNodes.length === 0) {
			return null;
		} else {
			return this.__childNodes[this.__childNodes.length - 1];
		}
	},
});

// Only used at run time; avoid circular dependency issues.
var fragment = require('./fragment');
var Fragment = fragment.Fragment;

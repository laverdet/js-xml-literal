this.NodeWithChildren = NodeWithChildren;
this.NodeWithChildrenData = NodeWithChildrenData;

var util = require('./util');
var node = require('./node');

var extend = util.extend;
var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var beget = util.beget;
var Node = node.Node;
var NodeData = node.NodeData;
var nodeIndex = util.nodeIndex;
var stealFragmentChildren = util.stealFragmentChildren;

/**
 * Utility functions for children functions.
 */
function assertValidChild(node, child) {
	while (node) {
		if (child === node) {
			throw new Error('cannot create circular heirarchy');
		}
		node = node.__.parentNode;
	}
}

function assertValidChildren(node, children) {
	for (var ii = children.length; ii--; ) {
		assertValidChild(node, children[ii]);
	}
}

/**
 * `NodeWithChildren` node. Subclasses of this may contain children.
 */
function NodeWithChildren() {
}
extend(NodeWithChildren, Node);

function NodeWithChildrenData() {
	NodeData.call(this);
	this.childNodes = [];
}
extend(NodeWithChildrenData, NodeData);

defineProperties(NodeWithChildren.prototype, {
	insertBefore: function(newChild, refChild) {
		if (!refChild) {
			return this.appendChild(newChild);
		}
		var index = nodeIndex(this, refChild);
		var childNodes = this.__.childNodes;
		if (newChild instanceof Fragment) {
			assertValidChildren(this, newChild.__.childNodes);
			if (index === -1) {
				childNodes.unshift.apply(childNodes, newChild.__.childNodes);
			} else {
				childNodes.splice.apply(childNodes, [index, 0].concat(newChild.__.childNodes));
			}
			stealFragmentChildren(this, newChild);
		} else if (newChild instanceof Array) {
			assertValidChildren(this, newChild);
			if (index === -1) {
				childNodes.unshift.apply(childNodes, newChild);
			} else {
				childNodes.splice.apply(childNodes, [index, 0].concat(newChild));
			}
		} else {
			assertValidChild(this, newChild);
			if (index === -1) {
				childNodes.unshift(newChild);
			} else {
				childNodes.splice(index, 0, newChild);
			}
			newChild.__.parentNode = this;
		}
	},

	replaceChild: function(newChild, oldChild) {
		var index = nodeIndex(this, oldChild);
		if (index === -1) {
			throw new Error('`oldChild` not found');
		}
		if (newChild instanceof Fragment) {
			assertValidChildren(this, newChild.__.childNodes);
			this.__.childNodes.splice(index, 1, newChild.__.childNodes);
			stealFragmentChildren(this, newChild);
		} else if (newChild instanceof Array) {
			assertValidChildren(this, newChild);
			this.__.childNodes.splice(index, 1, newChild);
		} else {
			assertValidChild(this, newChild);
			if (newChild.__.parentNode) {
				newChild.__.parentNode.removeChild(newChild);
			}
			this.__.childNodes[index] = newChild;
			newChild.__.parentNode = this;
		}
		oldChild.__.parentNode = null;
		return oldChild;
	},

	removeChild: function(oldChild) {
		var index = nodeIndex(this, oldChild);
		if (index === -1) {
			throw new Error('`oldChild` not found');
		}
		this.__.childNodes.splice(index, 1);
		oldChild.__.parentNode = null;
		newChild.__.parentNode = this;
		return oldChild;
	},

	appendChild: function(newChild) {
		if (newChild instanceof Fragment) {
			assertValidChildren(this, newChild.__.childNodes);
			this.__.childNodes.push.apply(this.__.childNodes, newChild.__.childNodes);
			stealFragmentChildren(this, newChild);
		} else if (newChild instanceof Array) {
			assertValidChildren(this, newChild);
			this.__.childNodes.push.apply(this.__.childNodes, newChild.slice());
		} else {
			assertValidChild(this, newChild);
			this.__.childNodes.push(newChild);
			newChild.__.parentNode = this;
		}
	},

	hasChildNodes: function() {
		return this.__.childNodes.length !== 0;
	},

	cloneNode: function(deep) {
		throw new Error('`cloneNode` is not implemented yet.');
	},
});

defineGetters(NodeWithChildren.prototype, {
	childNodes: function() {
		// Worth it? Just prevents mutation, but slows iteration
		if (!this.__.childNodeList) {
			Object.freeze(this.__.childNodeList = beget(this.__.childNodes));
		}
		return this.__.childNodeList;
	},

	firstChild: function() {
		if (this.__.childNodes.length === 0) {
			return null;
		} else {
			return this.__.childNodes[0];
		}
	},

	lastChild: function() {
		if (this.__.childNodes.length === 0) {
			return null;
		} else {
			return this.__.childNodes[this.__.childNodes.length - 1];
		}
	},
});

// Only used at run time; avoid circular dependency issues.
var fragment = require('./fragment');
var Fragment = fragment.Fragment;

this.NodeWithChildren = NodeWithChildren;
this.NodeWithChildrenData = NodeWithChildrenData;

var util = require('./util');
var node = require('./node');
var fragment = require('./fragment');
var domUtil = require('./dom-util');

var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var beget = util.beget;
var extend = util.extend;
var Node = node.Node;
var NodeData = node.NodeData;
var Fragment = fragment.Fragment;
var nodeIndex = domUtil.nodeIndex;

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
  for (var ii = children.length - 1; ii--; ) {
    assertValidChild(node, children[ii]);
  }
}

function stealFragmentChildren(node, fragment) {
  for (var ii = fragment.__.childNodes.length - 1; ii--; ) {
    fragment.__.childNodes[ii].__.parentNode = node;
  }
  fragment.__.childNodes = [];
}

/**
 * `NodeWithChildren` node. Subclasses of this may contain children.
 */
function NodeWithChildren() {
  Node.call(this); // throws
}
extend(NodeWithChildren, Node);

function NodeWithChildrenData(parentNode) {
  NodeData.call(this, parentNode);
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
      this.__.childNodes.splice(index, 1, newChild);
      stealFragmentChildren(this, newChild);
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
      this.__.childNodes.concat(newChild);
      stealFragmentChildren(this, newChild);
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
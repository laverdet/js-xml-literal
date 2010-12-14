this.nodeIndex = nodeIndex;
this.NodeError = NodeError;

var util = require('./util');

var extend = util.extend;

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
 * Errors thrown by the runtime
 */
function NodeError() {}
extend(NodeError, Error);

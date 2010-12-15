this.nodeIndex = nodeIndex;
this.stealFragmentChildren = stealFragmentChildren;
this.escapeElementValue = escapeElementValue;
this.escapeAttributeValue = escapeAttributeValue;

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

function stealFragmentChildren(node, fragment) {
  for (var ii = fragment.__.childNodes.length - 1; --ii >= 0; ) {
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

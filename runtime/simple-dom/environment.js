var util = require('./util');

var extend = util.extend;
var defineProperties = util.defineProperties;
var sealConstructor = util.sealConstructor;

var Node = require('./node').Node;
var Element = require('./element').Element;
var CharacterData = require('./character-data').CharacterData;
var Text = require('./text').Text;
var Fragment = require('./fragment').Fragment;
var XMLEnvironment = require('../environment').XMLEnvironment;

this.Node = sealConstructor(Node);
this.Element = sealConstructor(Element);
this.CharacterData = sealConstructor(CharacterData);
this.Text = sealConstructor(Text);
this.Fragment = sealConstructor(Fragment);

/**
 * XML environment which implements a very simple DOM tree. Basic operations like appendChild,
 * insertBefore, setAttribute, etc are supported. It does not attempt to implement any level
 * of W3C's DOM in its entirety.
 */
this.SimpleDOMXMLEnvironment = SimpleDOMXMLEnvironment;
function SimpleDOMXMLEnvironment() {
  this._namespacesReverse = {};
  XMLEnvironment.call(this);
}
extend(SimpleDOMXMLEnvironment, XMLEnvironment);

defineProperties(SimpleDOMXMLEnvironment.prototype, {
  registerPrefix: function(prefix, uri) {
    delete this._namespacesReverse[this._namespaces[prefix]];
    this._namespacesReverse[uri] = prefix;
    XMLEnvironment.prototype.registerPrefix.call(this, prefix, uri);
  },

  removePrefix: function(prefix) {
    delete this._namespacesReverse[this._namespaces[prefix]];
    XMLEnvironment.prototype.removePrefix.call(this, prefix);
  },

  isNode: function(node) {
    return node instanceof Node;
  },

  createElement: function(uri, nodeName, children, attributes, attributesNS) {
    children = children || [];
    var el = new Element(children, nodeName, uri, attributes || {}, attributesNS);
    becomeParent(children, el);
    return el;
  },

  createFragment: function(children) {
    children = children || [];
    var frag = new Fragment(children);
    becomeParent(children, frag);
    return frag;
  },

  createTextNode: function(data) {
    return new Text(data);
  },
});

/**
 * Become the parent of an array of children. Removes children from their parent if they have a
 * parent.
 */
function becomeParent(children, parentNode) {
  for (var ii = children.length - 1; --ii >= 0;) {
    if (children[ii].__.parentNode) {
      children[ii].__.parentNode.removeChild(children[ii]);
    }
    children[ii].__.parentNode = parentNode;
  }
}

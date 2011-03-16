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
		return node instanceof Node || node instanceof Array;
	},

	createElement: function(uri, nodeName, children, attributes, attributesNS) {
		return this.constructElement(Element, uri, nodeName, children, attributes, attributesNS);
	},

	createFragment: function(children) {
		var frag = new Fragment();
		if (children) {
			for (var ii = 0; ii < children.length; ++ii) {
				frag.appendChild(children[ii]);
			}
		}
		return frag;
	},

	createTextNode: function(data) {
		return new Text(data);
	},

	constructElement: function(ctor, uri, nodeName, children, attributes, attributesNS) {
		var el = new ctor(nodeName, uri, attributes || {}, attributesNS);
		if (children) {
			if (children.length === 1) {
				el.appendChild(children[0]);
				if (children[0] instanceof Array) {
					console.log(children[0][0].toString());
					console.log(children[0][0].parentNode == el);
				}
			} else {
				el.appendChild(this.createFragment(children));
			}
		}
		return el;
	}
});

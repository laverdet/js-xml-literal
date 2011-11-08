this.Element = Element;

var util = require('./util');
var environment = require('../environment');
var nodeWithChildren = require('./node-with-children');

var ToString = util.ToString;
var extend = util.extend;
var escapeAttributeValue = util.escapeAttributeValue;
var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var XMLEnvironment = environment.XMLEnvironment;
var NodeWithChildren = nodeWithChildren.NodeWithChildren;

/**
 * Creates a string of indentation
 */
function indent(level) {
	var buf = '';
	while (level--) {
		buf += '  ';
	}
	return buf;
}

/**
 * `Element` node. Represents a named element.
 */
function Element(nodeName, namespaceURI, attributes, attributesNS) {
	NodeWithChildren.call(this);
	this.__attributes = attributes;
	this.__attributesNS = attributesNS;
	this.__namespaceURI = namespaceURI;
	this.__nodeName = nodeName;
}
extend(Element, NodeWithChildren);

Object.defineProperty(Element.prototype, '_selfClosing', {
	value: true,
	configurable: true,
});

function resolvePrefix(uri, namespaces) {
	if (uri in namespaces) {
		return namespaces[uri];
	}
	var prefix, ii = 0;
	do {
		prefix =
			String.fromCharCode(Math.floor(ii / 25) + 97) + String.fromCharCode(ii % 25 + 97);
		++ii;
	} while (prefix in namespaces);
	namespaces[uri] = prefix;
	return prefix;
}

function elementToString(el, namespaces, usedNamespaces, pretty, level, first) {
	// open tag
	var str = '<';
	if (namespaces[el.__namespaceURI] !== '') {
		usedNamespaces[el.__namespaceURI] = true;
		str += resolvePrefix(el.__namespaceURI, namespaces) + ':';
	}
	str += el.__nodeName;

	// attributes
	for (var ii in el.__attributes) {
		var val;
		if (el.__attributes[ii] === true) {
			val = ii;
		} else if (el.__attributes[ii] === false) {
			continue;
		} else {
			val = escapeAttributeValue(ToString(el.__attributes[ii]));
		}
		str += ' ' + ii + '="' + val + '"';
	}

	// namespaced attributes
	for (var uri in el.__attributesNS) {
		for (var ii in el.__attributesNS[uri]) {
			var val;
			if (el.__attributesNS[uri][ii] === true) {
				val = ii;
			} else if (el.__attributesNS[uri][ii] === false) {
				continue;
			} else {
				val = escapeAttributeValue(ToString(el.__attributesNS[uri][ii]));
			}
			usedNamespaces[uri] = true;
			str += ' ' + resolvePrefix(uri, namespaces) + ':' + ii + '="' + val + '"';
		}
	}

	// children (must render these first to figure out which namespaces were found)
	var content = '';
	for (var ii = 0; ii < el.__childNodes.length; ++ii) {
		if (pretty) {
			if (el.__childNodes.length || el.__childNodes[0] instanceof Element) {
				content += '\n';
				content += indent(level + 1);
			}
		}
		if (el.__childNodes[ii] instanceof Element) {
			content +=
				elementToString(el.__childNodes[ii], namespaces, usedNamespaces, pretty, level + 1);
		} else {
			content += el.__childNodes[ii].toString();
		}
	}
	if (pretty && (el.__childNodes.length || el.__childNodes[0] instanceof Element)) {
		content += '\n';
	}

	// top-level element must render namespace declarations
	if (first) {
		for (var uri in usedNamespaces) {
			str += ' xmlns:' + namespaces[uri] + '="' + escapeAttributeValue(uri) + '"';
		}
	}

	// self-closing tag with no children
	if (el._selfClosing && el.__childNodes.length === 0) {
		return str + '/>';
	}
	return str + '>' + content + '</' + el.__nodeName + '>';
}

function normalizeName(name) {
	name = ToString(name);
	if (!/^[A-Za-z_][A-Za-z_\-.0-9]*$/.test(name)) {
		throw new TypeError('XML name contains an invalid character');
	}
	return name.toLowerCase();
}

defineProperties(Element.prototype, {
	getAttribute: function(attr) {
		return this.__attributes[normalizeName(attr)];
	},

	setAttribute: function(attr, val) {
		this.__attributes[normalizeName(attr)] = val;
	},

	getAttributeNS: function(uri, attr) {
		uri = ToString(uri);
		if (uri === '') {
			return this.getAttribute(attr);
		}
		if (this.__attributesNS && (uri in this.__attributesNS)) {
			return this.__attributesNS[uri][normalizeName(attr)];
		}
		return undefined;
	},

	setAttributeNS: function(uri, attr, val) {
		uri = ToString(uri);
		if (uri === '') {
			return this.setAttribute(attr, val);
		}
		if (!this.__attributesNS) {
			this.__attributesNS = {};
		}
		if (!(uri in this.__attributesNS)) {
			this.__attributesNS[uri] = {};
		}
		this.__attributesNS[uri][normalizeName(attr)] = val;
	},

	toString: function() {
		var env = XMLEnvironment.get();
		return elementToString(this, Object.create(env._namespacesReverse), {}, env.prettyPrint, 0, true);
	},
});

defineGetters(Element.prototype, {
	nodeName: function() {
		return this.__nodeName;
	},

	namespaceURI: function() {
		return this.__namespaceURI;
	},

	tagName: function() {
		return this.__nodeName;
	},
});

this.Element = Element;
this.ElementData = ElementData;

var util = require('./util');
var environment = require('../environment');
var nodeWithChildren = require('./node-with-children');

var beget = util.beget;
var ToString = util.ToString;
var extend = util.extend;
var escapeAttributeValue = util.escapeAttributeValue;
var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var XMLEnvironment = environment.XMLEnvironment;
var NodeWithChildren = nodeWithChildren.NodeWithChildren;
var NodeWithChildrenData = nodeWithChildren.NodeWithChildrenData;

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
	Object.defineProperty(this, '__', {
		value: new ElementData(nodeName, namespaceURI, attributes, attributesNS),
	});
}
extend(Element, NodeWithChildren);

function ElementData(nodeName, namespaceURI, attributes, attributesNS) {
	NodeWithChildrenData.call(this);
	this.attributes = attributes;
	this.attributesNS = attributesNS;
	this.namespaceURI = namespaceURI;
	this.nodeName = nodeName;
}
extend(ElementData, NodeWithChildrenData);

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
	if (namespaces[el.__.namespaceURI] !== '') {
		usedNamespaces[el.__.namespaceURI] = true;
		str += resolvePrefix(el.__.namespaceURI, namespaces) + ':';
	}
	str += el.__.nodeName;

	// attributes
	for (var ii in el.__.attributes) {
		var val;
		if (el.__.attributes[ii] === true) {
			val = ii;
		} else if (el.__.attributes[ii] === false) {
			continue;
		} else {
			val = escapeAttributeValue(ToString(el.__.attributes[ii]));
		}
		str += ' ' + ii + '="' + val + '"';
	}

	// namespaced attributes
	for (var uri in el.__.attributesNS) {
		for (var ii in el.__.attributesNS[uri]) {
			var val;
			if (el.__.attributesNS[uri][ii] === true) {
				val = ii;
			} else if (el.__.attributesNS[uri][ii] === false) {
				continue;
			} else {
				val = escapeAttributeValue(ToString(el.__.attributesNS[uri][ii]));
			}
			usedNamespaces[uri] = true;
			str += ' ' + resolvePrefix(uri, namespaces) + ':' + ii + '="' + val + '"';
		}
	}

	// children (must render these first to figure out which namespaces were found)
	var content = '';
	for (var ii = 0; ii < el.__.childNodes.length; ++ii) {
		if (pretty) {
			if (el.__.childNodes.length || el.__.childNodes[0] instanceof Element) {
				content += '\n';
				content += indent(level + 1);
			}
		}
		if (el.__.childNodes[ii] instanceof Element) {
			content +=
				elementToString(el.__.childNodes[ii], namespaces, usedNamespaces, pretty, level + 1);
		} else {
			content += el.__.childNodes[ii].toString();
		}
	}
	if (pretty && (el.__.childNodes.length || el.__.childNodes[0] instanceof Element)) {
		content += '\n';
	}

	// top-level element must render namespace declarations
	if (first) {
		for (var uri in usedNamespaces) {
			str += ' xmlns:' + namespaces[uri] + '="' + escapeAttributeValue(uri) + '"';
		}
	}

	// self-closing tag with no children
	if (el._selfClosing && el.__.childNodes.length === 0) {
		return str + '/>';
	}
	return str + '>' + content + '</' + el.__.nodeName + '>';
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
		return this.__.attributes[normalizeName(attr)];
	},

	setAttribute: function(attr, val) {
		this.__.attributes[normalizeName(attr)] = val;
	},

	getAttributeNS: function(uri, attr) {
		uri = ToString(uri);
		if (uri === '') {
			return this.getAttribute(attr);
		}
		if (this.__.attributesNS && (uri in this.__.attributesNS)) {
			return this.__.attributesNS[uri][normalizeName(attr)];
		}
		return undefined;
	},

	setAttributeNS: function(uri, attr, val) {
		uri = ToString(uri);
		if (uri === '') {
			return this.setAttribute(attr, val);
		}
		if (!this.__.attributesNS) {
			this.__.attributesNS = {};
		}
		if (!(uri in this.__.attributesNS)) {
			this.__.attributesNS[uri] = {};
		}
		this.__.attributesNS[uri][normalizeName(attr)] = val;
	},

	toString: function() {
		var env = XMLEnvironment.get();
		return elementToString(this, beget(env._namespacesReverse), {}, env.prettyPrint, 0, true);
	},
});

defineGetters(Element.prototype, {
	nodeName: function() {
		return this.__.nodeName;
	},

	namespaceURI: function() {
		return this.__.namespaceURI;
	},

	tagName: function() {
		return this.__.nodeName;
	},
});

/**
 * XMLEnvironment wraps up all the global behavior that XML literals will adhere to. An
 * XMLEnvironment must define 4 functions for generating XML objects:
 *
 * function isNode(node);
 *   Returns `true` if `node` is any kind of Node; i.e. Node, Fragment, Text, Comment, etc.
 *
 * function createElement(uri, nodeName, children, attributes, attributesNS);
 *   Creates an element usable in this environment.
 *   uri:          Namespace URI for this element.
 *   nodeName:     Local name of this node; i.e. no prefix or URI included. This name is NOT
 *                 normalized and will appear with its original casing, however it will always be
 *                 a string.
 *   children:     Array of children. `undefined` if there are no children. Note that the array may
 *                 contain any combination of `Node`, `Text`, or `Fragment`s.
 *   attributes:   Map of attributes with no namespace. `undefined` if there are no attributes.
 *                 Looks like: {<attr>: <value>, ...}.
 *                 Attribute values are NOT casted to strings in the case of embedded expressions.
 *                 i.e. <a href={obj} /> may give you a non-string attribute.
 *   attributesNS: Map of attributes with namespaces. `undefined` if there are no attributes.
 *                 Looks like: {<uri>: {<attr>: <value>, ...}, ...}
 *
 * function createFragment(children);
 *   Creates a document fragment.
 *   children:     Array of children. `undefined` for an empty fragment. Note that the array may
 *                 contain any combination of `Node`, `Text`, or `Fragment`s.
 *
 * function createTextNode(data);
 *   data:         Unescaped data for this text node.
 *
 * If I cared more, there would be interfaces for `createComment`, and
 * `createProcessingInstruction`... but these are generally useless to me. If any of the creation
 * functions return a falsey value, that element will be ignored.
 *
 * The API of the document is left to the implementation to decide. Unless the bundled psuedo-DOM
 * API is used, js-xml-literal only handles the construction of new objects via XML literal syntax.
 *
 * When called in a browser, XMLEnvironment will be defined in the global object. When called as a
 * CommonJS module it will be an export. In the CommonJS case, you must make this a global yourself.
 */
~function() {
	this.XMLEnvironment = XMLEnvironment;
	function XMLEnvironment(fns) {
		this._namespaces = {};
		this.ignoreWhitespace = true;
		this.registerPrefix('', '');
	};

	XMLEnvironment.get = function() {
		return XMLEnvironment._currentEnvironment;
	}

	XMLEnvironment.set = function(env) {
		XMLEnvironment._currentEnvironment = env;
	}

	XMLEnvironment.prototype = {
		registerPrefix: function(prefix, uri) {
			this._namespaces[prefix] = uri;
		},

		removePrefix: function(prefix) {
			if (!(prefix in this._namespaces)) {
				throw new Error('namespace `' + prefix + '` does not exist');
			}
			delete this._namespaces[prefix];
		},

		_el: function(descriptor) {
			return this._generateChildren([descriptor], this._namespaces)[0];
		},

		_frag: function(descriptor) {
			return this.createFragment(
				descriptor ? this._generateChildren(descriptor, this._namespaces) : []);
		},

		_generateChildren: function(descriptors, namespaces) {
			var elements = [];
			for (var ii = 0; ii < descriptors.length; ++ii) {
				var descriptor = descriptors[ii];
				if (descriptor.type === 1) { // TYPE_ELEMENT
					// Check tag match
					var open = descriptorToString(descriptor.open);
					var close = descriptorToString(descriptor.close);
					if (open !== close && close !== undefined) {
						throw new SyntaxError('XML tag name mismatch (expected ' + open + ')');
					}

					// Loop through attributes once to xmlns declarations
					var keys = descriptor.attributes && descriptor.attributes.keys;
					var vals = descriptor.attributes && descriptor.attributes.vals;
					var currentNamespaces;
					if (keys) {
						for (var jj = 0; jj < keys.length; ++jj) {
							if (xmlnsRegex.test(keys[jj])) {
								currentNamespaces = currentNamespaces || beget(namespaces);
								var xmlns = parseXMLName(keys[jj]);
								currentNamespaces[xmlns[1] ? xmlns[2] : ''] = vals[jj];
								keys.splice(jj, 1);
								vals.splice(jj, 1);
								--jj;
							}
						}
					}
					currentNamespaces = currentNamespaces || namespaces;

					// Parse element's name
					var nodeName = parseXMLName(open);
					var namespaceURI;
					if (nodeName[1]) {
						// Namespace via prefix
						if (!(nodeName[1] in currentNamespaces)) {
							throw new TypeError('invalid XML namespace ' + nodeName[1]);
						}
						namespaceURI = currentNamespaces[nodeName[1]];
					} else {
						namespaceURI = currentNamespaces[''];
					}

					// Generate attributes
					if (keys) {
						var attributes = {}, attributesNS = undefined;
						for (var jj = 0; jj < keys.length; ++jj) {
							var attrName = parseXMLName(keys[jj]);
							if (attrName[1]) {
								// Namespaced attributes
								if (!(attrName[1] in currentNamespaces)) {
									throw new TypeError('invalid XML namespace ' + attrName[1]);
								}
								var attrURI = currentNamespaces[attrName[1]];
								if (attrURI !== '') {
									attributesNS = attributesNS || {};
									if (!(attrURI in attributesNS)) {
										attributesNS[attrURI] = {};
									}
									if (attrName[2] in attributesNS[attrURI]) {
										throw new TypeError('duplicate XML attribute ' + keys[jj]);
									}
									attributesNS[attrURI][attrName[2]] = vals[jj];
									continue;
								}
							}

							// Non-namespaced attribute
							if (attrName[2] in attributes) {
								throw new TypeError('duplicate XML attribute ' + keys[jj]);
							}
							attributes[attrName[2]] = vals[jj];
						}
					}

					// Generate children
					var children = descriptor.content ?
						this._generateChildren(descriptor.content, currentNamespaces) : undefined;

					// Construct this element
					var element =
						this.createElement(namespaceURI, nodeName[2], children, attributes, attributesNS);
					if (element) {
						elements.push(element);
					}
					continue;
				}

				if (descriptor.type === 3) { // TYPE_EXPR
					if (descriptor.value === undefined || descriptor.value === null) {
						continue;
					} else if (this.isNode(descriptor.value)) {
						elements.push(descriptor.value);
						continue;
					} else {
						descriptor.value = ToString(descriptor.value);
					}
				} else if (descriptor.type === 2) { // TYPE_CDATA
					if (this.ignoreWhitespace) {
						/**
						 * Hairbrained whitespace logic!
						 *
						 * Goals:
						 *
						 * 1) Pretty HTML doesn't contain problematic whitespace:
						 *      <span>
						 *        Hello
						 *      </span>
						 *    same as..
						 *      <span>Hello</span>
						 *
						 * 2) Meaningful whitespace persists:
						 *      <span>My name is: <b>Marcel</b></span>
						 *    not the same as..
						 *      <span>My name is:<b>Marcel</b><span>
						 *
						 */

						// First remove whitespace that starts on its own line
						descriptor.value = descriptor.value.replace(newlineWithSpaces, '\n');

						// Then remove newlines from the front and back
						descriptor.value = descriptor.value.replace(leadingAndTrailingNewlinesRegex, '');
					}
				}
				if (descriptor.value !== '') {
					var element = this.createTextNode(descriptor.value);
					if (element) {
						elements.push(element);
					}
				}
			}
			return elements;
		}
	};

	/**
	 * Inline utility functions for easy client code deployment.
	 */
	var xmlnsRegex = /^xmlns(?:$|:)/,
			xmlNameRegex = /^(?:([a-zA-Z_][a-zA-Z0-9_.\-]*):)?([a-zA-Z_][a-zA-Z0-9_.\-]*)$/,
			newlineWithSpaces = /[\r\n]+[ \t]+/g,
			leadingAndTrailingNewlinesRegex = /(?:^[\n\r]+)|(?:[\n\r]+$)/g;
	function ToString(expr) {
		if (typeof expr === 'string') {
			return expr;
		} else if (expr === undefined) {
			return 'undefined';
		} else if (expr === null) {
			return 'null';
		}
		expr = expr.toString();
		if (typeof expr === 'string') {
			return expr;
		} else {
			throw new TypeError('can\'t convert expression to string');
		}
	}

	function beget(obj) {
		function F() {}
		F.prototype = obj;
		return new F;
	}

	function parseXMLName(name) {
		var ret = xmlNameRegex.exec(name);
		xmlNameRegex.lastIndex = 0;
		if (!ret) {
			throw new SyntaxError('illegal XML name ' + name);
		}
		return ret;
	}

	function descriptorToString(descriptor) {
		if (descriptor === undefined) {
			return undefined;
		}
		return descriptor.type === 3 ? ToString(descriptor.value) : descriptor;
	}
}.call(this);

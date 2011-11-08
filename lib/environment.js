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
			return this._generateChildren([descriptor])[0];
		},

		_frag: function(descriptor) {
			return this.createFragment(descriptor ? this._generateChildren(descriptor) : []);
		},

		_resolveNS: function(ns) {
			if (ns.charAt(0) !== '?') {
				return ns;
			}
			var uri = this._namespaces[ns.substring(1)];
			if (uri === undefined) {
				throw new TypeError('invalid XML namespace `'+ ns.substring(1)+ '`');
			}
			return uri;
		},

		_generateChildren: function(descriptors) {
			// Alloc an array assuming every descriptor will resolve to an element
			var elements = Array(descriptors.length), length = 0;

			for (var ii = 0; ii < descriptors.length; ++ii) {
				var descriptor = descriptors[ii];
				if (descriptor._type === 1) { // TYPE_ELEMENT

					// Resolve NS
					var nodeNS = descriptor._ns;
					if (nodeNS !== undefined) {
						nodeNS = this._resolveNS(nodeNS);
					} else {
						nodeNS = this._namespaces[''];
					}

					// Resolve NS attributes
					var attributesNS = descriptor._ns_attrs;
					if (attributesNS !== undefined) {
						for (var uri in attributesNS) {
							if (uri.charAt(0) === '?') {
								attributesNS[this._resolveNS(uri)] = attributesNS[uri];
								delete attributesNS[uri];
							}
						}
					}

					// Generate children
					var children = descriptor._content ? this._generateChildren(descriptor._content) : undefined;

					// Construct this element
					var element =
						this.createElement(nodeNS, descriptor._name, children, descriptor._attrs, attributesNS);
					if (element) {
						elements[length++] = element;
					}
					continue;
				}

				var value = descriptor._value;
				if (descriptor._type === 2) { // TYPE_CDATA
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
						value = value.replace(newlineWithSpaces, '\n');

						// Then remove newlines from the front and back
						value = value.replace(leadingAndTrailingNewlinesRegex, '');
					}
				} else if (descriptor._type === 3) { // TYPE_EXPR
					if (value === undefined || value === null) {
						continue;
					} else if (this.isNode(value)) {
						elements[length++] = value;
						continue;
					} else {
						value = ToString(value);
					}
				}

				if (value !== '') {
					var element = this.createTextNode(value);
					if (element) {
						elements[length++] = element;
					}
				}
			}

			elements.length = length;
			return elements;
		}
	};

	/**
	 * Inline utility functions for easy client code deployment.
	 */
	var newlineWithSpaces = /[\r\n]+[ \t]+/g,
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
}.call(this);

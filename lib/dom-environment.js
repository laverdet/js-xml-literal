/**
 * A light-weight XMLEnvironment which lets you use XML literals to directly interact with DOM
 * trees.
 *
 * Just create a new DOMXMLEnvironment and set it as the active XMLEnvironment:
 *
 * XMLEnvironment.set(new DOMXMLEnvironment(document));
 *
 * Now XML literal expressions will create DOM objects using native functions.
 *
 *   var anchor = document.createElement('div');
 *   anchor.setAttribute('href', '/home');
 *   anchor.appendChild(document.createTextNode('Home'));
 *
 * is practically equivalent to:
 *
 *   var anchor = <a href="/home">Home</a>;
 *
 * The supplied document needs very few features in order for XML literals to behave correctly. Specifically:
 * document.createElement()
 * document.createElementNS() (only if namespaces are used)
 * document.setAttribute()
 * document.setAttributeNS() (only if namespaces are used)
 * document.createDocumentFragment()
 * Node.appendChild()
 * Node.ownerDocument
 */
~function() {
	this.DOMXMLEnvironment = DOMXMLEnvironment;
	function DOMXMLEnvironment(document) {
		XMLEnvironment.call(this);

		this.isNode = function(node) {
			return node.ownerDocument === document;
		};

		this.createElement = function(uri, nodeName, children, attributes, attributesNS) {
			// Create element
			var el = uri === '' ?
				document.createElement(nodeName) : document.createElementNS(uri, nodeName);

			// Set attributes
			for (var ii in attributes) {
				if (ii === 'class') {
					// You must do `node.setAttribute('className', ...)` in IE.
					el.className = attributes[ii];
				} else if (ii === 'style') {
					// Use `cssText` instead
					el.cssText = attributes[ii];
				} else if (ii.lastIndexOf('on', 2) === 0) {
					// Directly set events to avoid catastrophic string coercion
					el[ii] = attributes[ii];
				} else {
					// Other attributes can just use `setAttribute`
					el.setAttribute(ii, attributes[ii]);
				}
			}
			for (var uri in attributesNS) {
				for (var ii in attributesNS[uri]) {
					el.setAttributeNS(uri, ii, attributes[uri][ii]);
				}
			}

			// Append children
			if (children && children.length) {
				el.appendChild(children.length === 1 ? children[0] : this.createFragment(children));
			}
			return el;
		};

		this.createFragment = function(children) {
			var frag = document.createDocumentFragment();
			for (var ii = 0; ii < children.length; ++ii) {
				frag.appendChild(children[ii]);
			}
			return frag;
		};

		this.createTextNode = function(data) {
			return document.createTextNode(data);
		};
	};
	function F() {}
	F.prototype = XMLEnvironment.prototype;
	DOMXMLEnvironment.prototype = new F;
}.call(this);

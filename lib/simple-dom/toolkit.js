/**
 * Library for 3rd parties to define their own elements.
 */
var util = require('./util');

this.defineAttributeAccessors = defineAttributeAccessors;
this.createElementCtor = createElementCtor;
this.sealConstructor = util.sealConstructor;

var element = require('./element');

var Element = element.Element;
var extend = util.extend;

/**
 * Creates a new constructor which subclasses `Element`. It's not enough to subclass `Element` on
 * your own because it is a restricted constructor. Subclasses from this function will have their
 * constructor called AFTER `Element`'s constructor is called. If you want to subclass further, you
 * must also use this function, and pass your base class via the second parameter.
 */
function createElementCtor(ctor, base) {
	function F(nodeName, namespaceURI, attributes, attributesNS) {
		Element.call(this, nodeName, namespaceURI, attributes, attributesNS);
		if (ctor) {
			ctor.call(ctor);
		}
	}
	if (base && !(base.prototype instanceof Element)) {
		throw new TypeError('`base` must be a subclass of `Element`');
	}
	extend(F, base || Element);
	return F;
}

/**
 * Defines accessors on an object (probaby an object prototype). Second parameter can be a list of
 * accessors to define, or a map of property to attribute.
 */
function defineAttributeAccessors(obj, getters) {
	if (getters instanceof Array) {
		var map = {};
		for (var ii = 0; ii < getters.length; ++ii) {
			if (typeof getters[ii] === 'string') {
				map[getters[ii]] = getters[ii];
			} else {
				for (var jj in getters[ii]) {
					map[jj] = getters[ii][jj];
				}
			}
		}
		defineAttributeAccessors(obj, map);
	} else {
		for (var ii in getters) {
			~function(attr) {
				Object.defineProperty(obj.prototype, ii, {
					get: function() { return this.getAttribute(attr); },
					set: function(val) { this.setAttribute(attr, val); },
					configurable: true,
					enumerable: true,
				});
			}(getters[ii]);
		}
	}
}

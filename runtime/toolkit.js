/**
 * Library for 3rd parties to define their own elements.
 */
this.defineAttributeAccessors = defineAttributeAccessors;
this.createElementCtor = createElementCtor;

var element = require('./element');
var util = require('./util');

var Element = element.Element;
var ElementCtor = element.ElementCtor;
var extend = util.extend;

/**
 * Creates a new constructor which subclasses `Element`. It's not enough to subclass `Element` on
 * your own because it is a restricted constructor. Subclasses from this function will have their
 * constructor called AFTER `Element`'s constructor is called. If you want to subclass further, you
 * must also use this function, and pass your base class via the second parameter.
 */
function createElementCtor(ctor, base) {
  function F() {
    ElementCtor.apply(this, arguments);
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
      map[getters[ii]] = getters[ii];
    }
    defineAttributeAccessors(obj, map);
  } else {
    for (var ii in getters) {
      ~function(attr) {
        Object.defineProperty(obj.prototype, ii, {
          get: function() { return this.getAttribute(attr); },
          set: function(val) { this.setAttribute(attr, val); },
          enumerable: true,
        });
      }(getters[ii].toLowerCase());
    }
  }
}
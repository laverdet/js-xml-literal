this.XMLEnvironment = XMLEnvironment;

var currenttEnvironment = undefined;
var environmentStack = [];

function XMLEnvironment() {
  this._namespaces = {};
  this._namespacesReverse = {};
  this._factories = {};
  this.ignoreComments = true;
  this.ignoreProcessingInstructions = true;
  this.ignoreWhitespace = true;
  this.prettyPrint = false;
}

XMLEnvironment.prototype = {
  registerPrefix: function(prefix, uri) {
    this._namespaces[prefix] = uri;
    this._namespacesReverse[uri] = prefix;
  },

  removePrefix: function(prefix) {
    if (!(prefix in this._namespaces)) {
      throw new Error('namespace `' + prefix + '` does not exist');
    }
    delete this._namespacesReverse[this._namespaces[prefix]];
    delete this._namespaces[prefix];
  },

  registerFactory: function(uri, factory) {
    this._factories[uri] = factory;
  },

  removeFactory: function(uri) {
    if (!(uri in this._namespaces)) {
      throw new Error('factory `' + uri + '` does not exist');
    }
    delete this._factories[uri];
  },

  copy: function() {
    var copy = new XMLEnvironment;
    for (var ii in this._namespaces) {
      copy._namespaces[ii] = this._namespaces[ii];
    }
    for (var ii in this._factories) {
      copy._factories[ii] = this._factories[ii];
    }
    copy.ignoreComments = this.ignoreComments;
    copy.ignoreProcessingInstructions = this.ignoreProcessingInstructions;
    copy.ignoreWhitespace = this.ignoreWhitespace;
    copy.prettyPrint = this.prettyPrint;
    return copy;
  },
};

XMLEnvironment.get = function() {
  return currenttEnvironment;
}

XMLEnvironment.push = function(env) {
  environmentStack.push(env);
  currenttEnvironment = env;
}

XMLEnvironment.pop = function() {
  environmentStack.pop();
  currentEnvironment = environmentStack[environmentStack.length - 1];
}

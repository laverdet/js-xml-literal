var namespace = require('./namespace'), qname = require('./qname'), etc = require('./etc'),
    defaultNamespace = require('./default-namespace'), literalCtor = require('./literal-ctor'),
    XML = require('./xml').XML, XMLList = require('./xml-list').XMLList,
    safeInvoke = require('./safe-invoke'), desugar = require('e4x-bump').desugar;

/** TODO: DELETE THIS! LAZY!! */
global.print = require('util').print;
global.inspect = require('util').inspect;
global.dump = function(a) {
  print(inspect(a) + '\n');
}

// Global variables per spec + needed by runtime
var globals = {
  isXMLName: etc.isXMLName,
  Namespace: namespace.Namespace,
  QName: qname.QName,
  XML: XML,
  XMLList: XMLList,
  __defaultNamespace: '',
  __E4X: {
    createDefaultNamespace: defaultNamespace.createDefaultNamespace,
    setDefaultNamespace: defaultNamespace.setDefaultNamespace,

    ctorElement: literalCtor.ctorElement,
    ctorList: literalCtor.ctorList,

    attrIdentifier: etc.toAttributeName,
    qualifiedIdentifier: etc.toQualifiedIdentifier,
  },
};
for (var ii in globals) {
  this[ii] = global[ii] = globals[ii];
}
for (var ii in safeInvoke) {
  this.__E4X[ii] = safeInvoke[ii];
}

// Let the client decide what file extensions to register
this.register = function(ext) {
  var fs = require('fs');
  require.extensions['.' + ext] = function(module, filename) {
    var src = fs.readFileSync(filename, 'utf8');
    module._compile(desugar(src), filename);
  }
}

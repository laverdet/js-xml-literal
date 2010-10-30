this.getDefaultNamespace = getDefaultNamespace;
this.setDefaultNamespace = setDefaultNamespace;
this.createDefaultNamespace = createDefaultNamespace;
this.getGlobalNamespaces = getGlobalNamespaces;

/**
 * 12.1 The default xml namespace Statement
 *
 * When the runtime executes the statement `default xml namespace = '//'` this is rewritten to:
 * var __defaultNamespace = __E4X.createDefaultNamespace('//');
 *
 * Then, any time a function which may depend on the default namespace being in order is invoked
 * we first execute:
 * __E4X.setDefaultNamespace(__defaultNamespace)
 *
 * The spec calls for directly manipulating execution contexts which is not possible in client
 * scripts. However, this implementation should simulate the behavior described.
 *
 * The default xml namespace statement sets the value of the internal property [[DefaultNamespace]]
 * of the variable object associated with the current execution context (see section 10 of
 * ECMAScript Edition 3). The default xml namespace of the global scope has the initial value of no
 * namespace. If the default xml namespace statement occurs inside a FunctionDeclaration, the
 * internal property [[DefaultNamespace]] is added to the activation’s variable object and given
 * the initial value of no namespace. This [[DefaultNamespace]] property hides [[DefaultNamespace]]
 * properties of outer scopes.
 */
var globalNamespace = {'': ''};

/**
 * 12.1.1 GetDefaultNamespace()
 */
function getDefaultNamespace() {
  return globalNamespace[''];
}

function setDefaultNamespace(namespace) {
  globalNamespace[''] = namespace;
}

function createDefaultNamespace(namespace) {
  return new Namespace('', namespace);
}

function getGlobalNamespaces() {
  return globalNamespace;
}

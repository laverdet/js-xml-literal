this.getGlobalNamespaces = getGlobalNamespaces;
this.setGlobalNamespace = setGlobalNamespace;

var globalNamespaces = {'': ''};

function getGlobalNamespaces() {
  return globalNamespaces;
}

function setGlobalNamespace(prefix, uri) {
  globalNamespaces[prefix] = uri;
}

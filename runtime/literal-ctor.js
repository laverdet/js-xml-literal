this.ctorElement = ctorElement;
this.ctorList = ctorList;
var util = require('./util');
var beget = util.beget, parseXMLName = util.parseXMLName,
    Namespace = require('./namespace').Namespace,
    QName = require('./qname').QName,
    XML = require('./xml').XML,
    XMLList = require('./xml-list').XMLList,
    XMLElement = require('./xml-element').XMLElement,
    XMLText = require('./xml-text').XMLText,
    XMLAttribute = require('./xml-attribute').XMLAttribute,
    getGlobalNamespaces = require('./default-namespace').getGlobalNamespaces;

// Create a new xml literal
function ctorElement(element) {
  return generateChildren([element], getGlobalNamespaces(), true)[0];
}

// Create a new xml list
function ctorList(elements) {
  var list = new XMLList;
  list._content = generateChildren(elements, getGlobalNamespaces(), true);
  return list;
}

// Element constructors
function generateChildren(descriptors, ancestorNamespaces, first) {
  var elements = [];
  for (var ii = 0; ii < descriptors.length; ++ii) {
    var descriptor = descriptors[ii];
    switch (descriptor.type) {
      case 1: // TYPE_ELEMENT

        // check tag match
        if (descriptor.open !== descriptor.close && descriptor.close !== undefined) {
          throw new SyntaxError('XML tag name mismatch (expected ' + descriptor.open + ')');
        }

        // loop through attrs to get namespaces
        var keys = descriptor.attributes && descriptor.attributes.keys;
        var vals = descriptor.attributes && descriptor.attributes.vals;
        var currentNamespaces, localNamespaces;
        if (keys) {
          for (var jj = 0; jj < keys.length; ++jj) {
            if (/^xmlns(?:$|:)/.test(keys[jj])) {
              currentNamespaces = currentNamespaces || beget(ancestorNamespaces);
              localNamespaces = localNamespaces || [];
              var xmlns = parseXMLName(keys[jj]);
              currentNamespaces[xmlns[1] ? xmlns[2] : ''] = vals[jj];
              localNamespaces.push(new Namespace(xmlns[1] ? xmlns[2] : '', vals[jj]));
              keys.splice(jj, 1);
              vals.splice(jj, 1);
              --jj;
            }
          }
        }
        if (first) {
          if (!localNamespaces) {
            localNamespaces = [new Namespace];
          } else {
            var didSetDefaultNamespace = false;
            for (var jj = 0; jj < localNamespaces.length; ++jj) {
              if (localNamespaces[jj].prefix === '') {
                didSetDefaultNamespace = true;
                break;
              }
            }
            if (!didSetDefaultNamespace) {
              localNamespaces.unshift(new Namespace);
            }
          }
        }
        currentNamespaces = currentNamespaces || ancestorNamespaces;

        // generate a QName for this element
        var name = parseXMLName(descriptor.open);
        var qname;
        if (name[1]) {
          // namespace via prefix
          var namespace = currentNamespaces[name[1]];
          if (!namespace) {
            throw new TypeError('invalid XML namespace ' + name[1]);
          }
          qname = new QName(namespace, name[2]);
        } else {
          qname = new QName(currentNamespaces[''], name[2]);
        }

        // generate attributes
        var attributes = {};
        if (keys) {
          var nons = new Namespace;
          for (var jj = 0; jj < keys.length; ++jj) {
            var name = parseXMLName(keys[jj]);
            if (name[1]) {
              var namespace = currentNamespaces[name[1]];
              if (!namespace) {
                throw new TypeError('invalid XML namespace ' + name[1]);
              }
              attrqname = new QName(namespace, name[2]);
            } else {
              attrqname = new QName(nons, name[2]);
            }
            if (attrqname.uri in attributes) {
              if (attrqname.localName in attributes[attrqname.uri]) {
                throw new TypeError('duplicate XML attribute ' + keys[jj]);
              }
            } else {
              attributes[attrqname.uri] = {};
            }
            attributes[attrqname.uri][attrqname.localName] = new XMLAttribute(attrqname, vals[jj]);
          }
        }

        // generate children
        var children = descriptor.content ? generateChildren(descriptor.content, currentNamespaces) : [];
        var element = new XMLElement(qname, attributes, children, localNamespaces);
        for (var jj = 0; jj < children.length; ++jj) {
          children[jj]._parent = element;
        }
        elements.push(element);
        break;

      case 3: // TYPE_EXPR
        // 11.1.4 XML Initialiser; XMLElementContent : { Expression } XMLElementContent[opt]
        if (descriptor.value instanceof XML) {
          elements.push(descriptor.value._deepCopy());
          break;
        } else {
          descriptor.value = toString(descriptor.value);
        }
        /* fall through */

      case 2: // TYPE_CDATA
        if (!/^[ \r\n\t]+$/.test(descriptor.value) || !XML.ignoreWhitespace) {
          elements.push(new XMLText(descriptor.value));
        }
        break;
    }
  }
  return elements;
}

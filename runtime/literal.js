this.ctorElement = ctorElement;
this.ctorList = ctorList;

var util = require('./util');
var environment = require('./environment');
var namespace = require('./namespace');
var node = require('./node');
var element = require('./element');
var text = require('./text');

var toString = util.toString;
var getGlobalNamespaces = namespace.getGlobalNamespaces;
var Node = node.Node;
var ElementCtor = element.ElementCtor;
var TextCtor = text.TextCtor;
var XMLEnvironment = environment.XMLEnvironment;

/**
 * Parses XML tag name and returns [..., <namespace>, <name]
 */
function parseXMLName(name) {
  var ret = /^(?:([a-zA-Z_][a-zA-Z0-9_.\-]*):)?([a-zA-Z_][a-zA-Z0-9_.\-]*)$/.exec(name);
  if (!ret) {
    throw new SyntaxError('illegal XML name ' + name);
  }
  return ret;
}

function ctorElement(element) {
  var env = XMLEnvironment.get();
  return generateChildren([element], env._namespaces, env._factories, null)[0];
}

function ctorList(element) {
  var list = new XMLList;
  list.__.childNodes = generateChildren(elements, env._namespaces, env._factories, list);
  return list;
}

function generateChildren(descriptors, namespaces, factories, parentNode) {
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
        var currentNamespaces;
        if (keys) {
          for (var jj = 0; jj < keys.length; ++jj) {
            if (/^xmlns(?:$|:)/.test(keys[jj])) {
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

        // parse element's name
        var name = parseXMLName(descriptor.open);
        var namespaceURI;
        if (name[1]) {
          // namespace via prefix
          if (!(name[1] in currentNamespaces)) {
            throw new TypeError('invalid XML namespace ' + name[1]);
          }
          namespaceURI = currentNamespaces[name[1]];
        } else {
          namespaceURI = currentNamespaces[''];
        }
        var nodeName = name[2];

        // construct
        var ctor;
        if (namespaceURI in factories) {
          ctor = factories[namespaceURI](nodeName);
        } else {
          ctor = ElementCtor;
        }
        var element = new ctor(parentNode, nodeName, namespaceURI);

        // generate attributes
        if (keys) {
          var attributes = {};
          for (var jj = 0; jj < keys.length; ++jj) {
            var attrName = parseXMLName(keys[jj]), attrURI = null;
            if (attrName[1]) {
              attrURI = currentNamespaces[name[1]];
              if (!namespace) {
                throw new TypeError('invalid XML namespace ' + name[1]);
              }
              element.setAttributeNS(attrURI, attrName[2], vals[jj]);
            } else {
              element.setAttribute(attrName[2], vals[jj]);
            }
            if (attrURI in attributes) {
              if (attrName[2] in attributes[attrURI]) {
                throw new TypeError('duplicate XML attribute ' + keys[jj]);
              }
            } else {
              attributes[attrURI] = {};
            }
            attributes[attrURI][attrName[2]] = true;
          }
        }

        // generate children
        var children = descriptor.content ?
          generateChildren(descriptor.content, currentNamespaces, element) : [];
        element.__.childNodes = children;
        elements.push(element);
        break;

      case 3: // TYPE_EXPR
        if (descriptor.value instanceof Node) {
          elements.push(descriptor.value);
          element.__.parentNode = parentNode;
          break;
        } else {
          descriptor.value = toString(descriptor.value);
        }
        /* fall through */

      case 2: // TYPE_CDATA
        if (!/^[ \r\n\t]+$/.test(descriptor.value)/* || !XML.ignoreWhitespace*/) {
          elements.push(new TextCtor(parentNode, descriptor.value));
        }
        break;
    }
  }
  return elements;
}

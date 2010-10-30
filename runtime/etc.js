this.escapeElementValue = escapeElementValue;
this.escapeAttributeValue = escapeAttributeValue;
this.toAttributeName = toAttributeName;
this.toXMLName = toXMLName;
this.isXMLName = isXMLName;
var toString = require('./util').toString,
    AttributeName = require('./attribute-name').AttributeName;

/**
 * 10.2.1.1 EscapeElementValue
 */
function escapeElementValue(val) {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 10.2.1.2 EscapeAttributeValue
 */
function escapeAttributeValue(val) {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#xA;')
    .replace(/\r/g, '&#xD;')
    .replace(/\t/g, '&#x9;');
}

/**
 * 10.5 ToAttributeName
 */
function toAttributeName(name) {
  if (name === undefined || name === null ||
      typeof name === 'boolean' || typeof name === 'number') {
    throw new TypeError;
  } else if (typeof name === 'string') {
    return new AttributeName(new Namespace, name);
  } else if (name instanceof QName) {
    return new AttributeName(name.uri, name.localName);
  } else if (name instanceof AttributeName) {
    return name;
  } else {
    return new AttributeName(new Namespace, toString(name));
  }
}

/**
 * 10.6 ToXMLName
 */
function toXMLName(name) {
  if (name === undefined || name === null ||
      typeof name === 'boolean' || typeof name === 'number') {
    throw new TypeError;
  } else if (typeof name === 'string') {
    if ((+name).toString() === name) {
      throw new TypeError;
    } else if (name[0] === '@') {
      return new toAttributeName(name.substring(1));
    } else {
      return new QName(name);
    }
  } else if (name instanceof QName) {
    // Also handles AttributeName
    return name;
  } else {
    return toXMLName(toString(name));
  }
}

/**
 * 13.1.2.1 isXMLName(value)
 */
function isXMLName(value) {
  // The isXMLName function examines the given value and determines whether it is a valid XML name
  // that can be used as an XML element or attribute name. If so, it returns true, otherwise it
  // returns false.
  // Note: This doesn't include all the crazy extended characters XML allows. The range of allowed
  // characters is so ridiculous and I am NOT going there.
  return /^[A-Za-z_][A-Za-z_\-.0-9]*$/.test(value);
}

this.AttributeName = AttributeName;
var extend = require('./util').extend,
    QName = require('./qname').QName;

/**
 * 9.3 The AttributeName Type
 *
 * The AttributeName type specifies the name of an XML attribute. A value of type AttributeName
 * may be specified using an `AttributeIdentifier`. If the name of the attribute is not specified
 * as a `QualifiedIdentifier`, the uri property of the associated QName will be the empty string
 * representing no namespace.
 */
function AttributeName() {
  QName.apply(this, arguments);
}
extend(QName, AttributeName, {
  toString: function() {
    return '@' + QName.prototype.toString.call(this);
  }
});

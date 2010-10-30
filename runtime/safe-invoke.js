this._get = get;
this._put = put;
this._equals = equals;
var XML = require('./xml').XML;

/**
 * Type-safe methods for XML operations. If the desugar engine is sure of the type of your object
 * it will call runtime methods on the object itself. For instance:
 *
 * var foo = <foo />;
 * print(foo.bar);
 *
 * Will become something like:
 * var foo = ...;
 * print(foo._get('bar'));
 *
 * But if it unable to determine what type your object will be, it will call one of these type-safe
 * methods. So this:
 *
 * var foo = fn() ? <foo /> : 'foo';
 * print(foo.bar);
 *
 * Would become:
 * var foo = fn() ? ... : 'foo';
 * print(__E4X._get(foo, 'bar'));
 *
 * You'll pay a (likely trivial) runtime cost if your variables are that dynamic. You can avoid this
 * by declaring your variables to be XML via typehints:
 * 
 * var foo:XML = fn();
 */
function get(obj, key) {
  return obj instanceof XML ? obj._get(key) : obj[key];
}

function put(obj, key, val) {
  return obj instanceof XML ? obj._put(key, val) : obj[key] = val;
}

function equals(left, right) {
  if (left instanceof XML) {
    return left._equals(right);
  } else if (right instanceof XML) {
    return right._equals(left);
  } else {
    return left == right;
  }
}

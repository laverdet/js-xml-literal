this.Fragment = Fragment;

var util = require('./util');
var nodeWithChildren = require('./node-with-children');

var extend = util.extend;
var defineProperties = util.defineProperties;
var NodeWithChildren = nodeWithChildren.NodeWithChildren;
var NodeWithChildrenData = nodeWithChildren.NodeWithChildrenData;

/**
 * Document fragment.
 */
function Fragment() {
	Object.defineProperty(this, '__', {
		value: new NodeWithChildrenData(),
		writeable: false,
		configurable: false,
		enumerable: false
	});
}
extend(Fragment, NodeWithChildren);

defineProperties(Fragment.prototype, {
	toString: function(pretty) {
		var str = '';
		for (var ii = 0; ii < this.__.childNodes.length; ++ii) {
			if (pretty && ii) {
				str += '\n';
			}
			str += this.__.childNodes[ii].toString(pretty);
		}
		return str;
	},
});

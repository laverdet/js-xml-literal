this.Fragment = Fragment;

var util = require('./util');
var nodeWithChildren = require('./node-with-children');

var extend = util.extend;
var defineProperties = util.defineProperties;
var NodeWithChildren = nodeWithChildren.NodeWithChildren;

/**
 * Document fragment.
 */
function Fragment() {
	NodeWithChildren.call(this);
}
extend(Fragment, NodeWithChildren);

defineProperties(Fragment.prototype, {
	toString: function(pretty) {
		var str = '';
		for (var ii = 0; ii < this.__childNodes.length; ++ii) {
			if (pretty && ii) {
				str += '\n';
			}
			str += this.__childNodes[ii].toString(pretty);
		}
		return str;
	},
});

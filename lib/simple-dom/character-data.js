this.CharacterData = CharacterData;

var util = require('./util');
var node = require('./node');

var defineProperties = util.defineProperties;
var defineGetters = util.defineGetters;
var extend = util.extend;
var Node = node.Node;
var NodeData = node.NodeData;

/**
 * Abstract `CharacterData` node. This is for `Text`, and `Comment` nodes.
 */
function CharacterData(data) {
	Node.call(this);
	this.__data = data;
}
extend(CharacterData, Node);

defineProperties(CharacterData.prototype, {
	appendData: function(data) {
		this.__data += data;
	},

	deleteData: function(offset, length) {
		this.__data = data.substr(0, offset) + data.substr(offset + length);
	},

	insertData: function(offset, data) {
		this.__data = data.substr(0, offset) + data + data.substr(offset);
	},

	replaceData: function(offset, length, data) {
		this.__data = data.substr(0, offset) + data + data.substr(offset + length);
	},

	substringData: function(offset, length) {
		return this.__data.substr(offset, length);
	},
});

defineGetters(CharacterData.prototype, {
	data: function() {
		return this.__data;
	},

	length: function() {
		return this.__data.length;
	},

	nodeValue: function() {
		return this.__data;
	}
});

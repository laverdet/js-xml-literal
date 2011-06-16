this.CharacterData = CharacterData;
this.CharacterDataData = CharacterDataData;

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
	Object.defineProperty(this, '__', {
		value: new CharacterDataData(data),
	});
}
extend(CharacterData, Node);

function CharacterDataData(data) {
	NodeData.call(this);
	this.data = data;
}
extend(CharacterDataData, NodeData);

defineProperties(CharacterData.prototype, {
	appendData: function(data) {
		this.__.data += data;
	},

	deleteData: function(offset, length) {
		this.__.data = data.substr(0, offset) + data.substr(offset + length);
	},

	insertData: function(offset, data) {
		this.__.data = data.substr(0, offset) + data + data.substr(offset);
	},

	replaceData: function(offset, length, data) {
		this.__.data = data.substr(0, offset) + data + data.substr(offset + length);
	},

	substringData: function(offset, length) {
		return this.__.data.substr(offset, length);
	},
});

defineGetters(CharacterData.prototype, {
	data: function() {
		return this.__.data;
	},

	length: function() {
		return this.__.data.length;
	},

	nodeValue: function() {
		return this.__.data;
	}
});

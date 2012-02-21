this.UnescapedData = UnescapedData;

var util = require('./util');
var characterData = require('./character-data');

var defineProperties = util.defineProperties;
var extend = util.extend;
var CharacterData = characterData.CharacterData;

/**
 * Raw markup in an XML tree. Danger!
 */
function UnescapedData(data) {
	CharacterData.call(this, data);
}
extend(UnescapedData, CharacterData);

defineProperties(UnescapedData.prototype, {
	toString: function() {
		return this.__data;
	},
});

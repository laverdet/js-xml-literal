this.Text = Text;

var util = require('./util');
var characterData = require('./character-data');

var extend = util.extend;
var escapeElementValue = util.escapeElementValue;
var defineProperties = util.defineProperties;
var CharacterData = characterData.CharacterData;

/**
 * `Text` node. For text in the DOM.
 */
function Text(data) {
	CharacterData.call(this, data);
}
extend(Text, CharacterData);

defineProperties(Text.prototype, {
	toString: function() {
		return escapeElementValue(this.__data);
	},
});

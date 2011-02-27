this.Text = Text;

var util = require('./util');
var characterData = require('./character-data');

var extend = util.extend;
var escapeElementValue = util.escapeElementValue;
var defineProperties = util.defineProperties;
var CharacterData = characterData.CharacterData;
var CharacterDataData = characterData.CharacterDataData;

/**
 * `Text` node. For text in the DOM.
 */
function Text(data) {
  Object.defineProperty(this, '__', {
    value: new CharacterDataData(data),
  });
}
extend(Text, CharacterData);

defineProperties(Text.prototype, {
  toString: function() {
    return escapeElementValue(this.__.data);
  },
});

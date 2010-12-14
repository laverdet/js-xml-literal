this.UnescapedData = UnescapedData;

var util = require('./util');
var characterData = require('./character-data');

var defineProperties = util.defineProperties;
var extend = util.extend;
var CharacterData = characterData.CharacterData;
var CharacterDataData = characterData.CharacterDataData;

/**
 * Raw markup in an XML tree. Danger!
 */
function UnescapedData(data) {
  Object.defineProperty(this, '__', {
    value: new CharacterDataData(null, data),
  });
}
extend(UnescapedData, CharacterData);

defineProperties(UnescapedData.prototype, {
  toString: function() {
    return this.__.data;
  },
});

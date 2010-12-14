this.Text = Text;
this.TextCtor = TextCtor;

var util = require('./util');
var characterData = require('./character-data');

var defineProperties = util.defineProperties;
var extend = util.extend;
var CharacterData = characterData.CharacterData;
var CharacterDataData = characterData.CharacterDataData;

/**
 * `Text` node. For text in the DOM.
 */
function Text() {
  CharacterData.call(this); // throws
}
extend(Text, CharacterData);

function TextCtor(parentNode, data) {
  Object.defineProperty(this, '__', {
    value: new CharacterDataData(parentNode, data),
  });
}
TextCtor.prototype = Text.prototype;

defineProperties(Text.prototype, {
  toString: function() {
    return this.__.data;
  },
});

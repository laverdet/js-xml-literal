var literal = require('./literal');
var node = require('./node');
var element = require('./element');
var characterData = require('./character-data');
var text = require('./text');
var desugar = require('e4x-bump').desugar;

this.Node = node.Node;
this.Element = element.Element;
this.CharacterData = characterData.CharacterData;
this.Text = text.Text;
global.__E4X = this.__E4X = {
  ctorElement: literal.ctorElement,
  ctorList: literal.ctorList,
};

this.register = function(ext) {
  var fs = require('fs');
  require.extensions['.' + ext] = function(module, filename) {
    var src = fs.readFileSync(filename, 'utf8');
    try {
      src = desugar(src);
    } catch(e) {
      throw new SyntaxError(filename + '\n' + e);
    }
    module._compile(src, filename);
  }
}

var literal = require('./literal');
var node = require('./node');
var element = require('./element');
var characterData = require('./character-data');
var text = require('./text');
var unescapedData = require('./unescaped-data');
var environment = require('./environment');
var html = require('./html');
var desugar = require('e4x-bump').desugar;

// Exports
var XMLEnvironment = environment.XMLEnvironment;
this.Node = node.Node;
this.Element = element.Element;
this.CharacterData = characterData.CharacterData;
this.Text = text.Text;
this.UnsafeUnescapedData = unescapedData.UnescapedData;
this.XMLEnvironment = environment.XMLEnvironment;
global.__E4X = this.__E4X = {
  ctorElement: literal.ctorElement,
  ctorList: literal.ctorList,
};

// Register which file extensions will pass through the desugarer
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

// Create a default environment
var env = new XMLEnvironment;
env.registerPrefix('', 'http://www.w3.org/1999/xhtml');
env.registerFactory('http://www.w3.org/1999/xhtml', htmlFactory);
XMLEnvironment.push(env);

// HTML factory
function htmlFactory(tagName) {
  if (tagName in elements) {
    return elements[tagName];
  }
  return HTMLUnknownElement;
}

var elements = {
  'a': html.HTMLAnchorElement,
  'abbr': html.HTMLElement,
  'acronym': html.HTMLElement,
  'address': html.HTMLElement,
  'applet': html.HTMLAppletElement,
  'area': html.HTMLAreaElement,
  'article': html.HTMLElement,
  'aside': html.HTMLElement,
  'audio': html.HTMLAudioElement,
  'b': html.HTMLElement,
  'base': html.HTMLBaseElement,
  'basefont': html.HTMLBaseFontElement,
  'bdo': html.HTMLElement,
  'big': html.HTMLElement,
  'blockquote': html.HTMLQuoteElement,
  'body': html.HTMLBodyElement,
  'br': html.HTMLBRElement,
  'button': html.HTMLButtonElement,
  'canvas': html.HTMLCanvasElement,
  'caption': html.HTMLTableCaptionElement,
  'center': html.HTMLElement,
  'cite': html.HTMLElement,
  'code': html.HTMLElement,
  'col': html.HTMLTableColElement,
  'colgroup': html.HTMLTableColElement,
  'dd': html.HTMLElement,
  'del': html.HTMLModElement,
  'dfn': html.HTMLElement,
  'dir': html.HTMLDirectoryElement,
  'div': html.HTMLDivElement,
  'dl': html.HTMLDListElement,
  'dt': html.HTMLElement,
  'em': html.HTMLElement,
  'embed': html.HTMLEmbedElement,
  'fieldset': html.HTMLFieldSetElement,
  'figcaption': html.HTMLElement,
  'figure': html.HTMLElement,
  'font': html.HTMLFontElement,
  'footer': html.HTMLElement,
  'form': html.HTMLFormElement,
  'frame': html.HTMLFrameElement,
  'frameset': html.HTMLFrameSetElement,
  'h1': html.HTMLHeadingElement,
  'h2': html.HTMLHeadingElement,
  'h3': html.HTMLHeadingElement,
  'h4': html.HTMLHeadingElement,
  'h5': html.HTMLHeadingElement,
  'h6': html.HTMLHeadingElement,
  'head': html.HTMLHeadElement,
  'header': html.HTMLElement,
  'hr': html.HTMLHRElement,
  'html': html.HTMLHtmlElement,
  'i': html.HTMLElement,
  'iframe': html.HTMLIFrameElement,
  'image': html.HTMLImageElement,
  'input': html.HTMLInputElement,
  'ins': html.HTMLModElement,
  'kbd': html.HTMLElement,
  'keygen': html.HTMLKeygenElement,
  'label': html.HTMLLabelElement,
  'li': html.HTMLLIElement,
  'link': html.HTMLLinkElement,
  'map': html.HTMLMapElement,
  'mark': html.HTMLElement,
  'menu': html.HTMLMenuElement,
  'meta': html.HTMLMetaElement,
  'nav': html.HTMLElement,
  'noembed': html.HTMLElement,
  'noframes': html.HTMLElement,
  'noscript': html.HTMLElement,
  'object': html.HTMLObjectElement,
  'ol': html.HTMLOListElement,
  'optgroup': html.HTMLOptGroupElement,
  'option': html.HTMLOptionElement,
  'output': html.HTMLOutputElement,
  'p': html.HTMLParagraphElement,
  'param': html.HTMLParamElement,
  'plaintext': html.HTMLPreElement,
  'pre': html.HTMLPreElement,
  'q': html.HTMLQuoteElement,
  'rp': html.HTMLElement,
  'rt': html.HTMLElement,
  'ruby': html.HTMLElement,
  's': html.HTMLElement,
  'samp': html.HTMLElement,
  'script': html.HTMLScriptElement,
  'section': html.HTMLElement,
  'select': html.HTMLSelectElement,
  'small': html.HTMLElement,
  'source': html.HTMLSourceElement,
  'span': html.HTMLSpanElement,
  'strike': html.HTMLElement,
  'strong': html.HTMLElement,
  'style': html.HTMLStyleElement,
  'sub': html.HTMLElement,
  'sup': html.HTMLElement,
  'table': html.HTMLTableElement,
  'tbody': html.HTMLTableSectionElement,
  'td': html.HTMLTableDataCellElement,
  'textarea': html.HTMLTextAreaElement,
  'tfoot': html.HTMLTableSectionElement,
  'th': html.HTMLTableHeaderCellElement,
  'thead': html.HTMLTableSectionElement,
  'title': html.HTMLTitleElement,
  'tr': html.HTMLTableRowElement,
  'tt': html.HTMLElement,
  'u': html.HTMLElement,
  'ul': html.HTMLUListElement,
  'var': html.HTMLElement,
  'video': html.HTMLVideoElement,
  'wbr': html.HTMLElement,
};

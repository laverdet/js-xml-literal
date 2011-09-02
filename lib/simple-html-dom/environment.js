var html = require('./html');
var simpleEnvironment = require('../simple-dom/environment');
var toolkit = require('../simple-dom/toolkit');
var util = require('../simple-dom/util');

var sealConstructor = toolkit.sealConstructor;
var XMLEnvironment = require('../environment').XMLEnvironment;
var SimpleDOMXMLEnvironment = simpleEnvironment.SimpleDOMXMLEnvironment;
var extend = util.extend;
var defineProperties = util.defineProperties;

this.Node = simpleEnvironment.Node;
this.Element = simpleEnvironment.Element;
this.CharacterData = simpleEnvironment.CharacterData;
this.Text = simpleEnvironment.Text;
this.Fragment = simpleEnvironment.Fragment;
for (var ii in html) {
	// todo: leakage?
	this[ii] = sealConstructor(html[ii]);
}

/**
 * Layer on top of SimpleDOMXMLEnvironment which adds support for HTML elements. This means you
 * can use simple accessors like `div.className = 'foo'` instead of having to do
 * `div.setAttribute('class', 'foo')`.
 */
this.SimpleHTMLDOMXMLEnvironment = SimpleHTMLDOMXMLEnvironment;
function SimpleHTMLDOMXMLEnvironment(uri) {
	SimpleDOMXMLEnvironment.call(this);
	this.uri = uri || 'http://www.w3.org/1999/xhtml';
	this.registerPrefix('', this.uri);
}
extend(SimpleHTMLDOMXMLEnvironment, SimpleDOMXMLEnvironment);

SimpleHTMLDOMXMLEnvironment.prototype.createElement =
function(uri, nodeName, children, attributes, attributesNS) {
	if (this.uri === uri) {
		nodeName = nodeName.toLowerCase();
		var ctor = (nodeName in elements) ? elements[nodeName] : HTMLUnknownElement;
		return this.constructElement(ctor, uri, nodeName, children, attributes, attributesNS);
	} else {
		return SimpleDOMXMLEnvironment.prototype.createElement.call(
			this, uri, nodeName, children, attributes, attributesNS);
	}
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
	'img': html.HTMLImageElement,
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

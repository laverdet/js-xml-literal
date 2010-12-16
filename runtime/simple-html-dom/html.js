/**
 * Extension to bring support for HTML elements to Simple DOM.
 */
var toolkit = require('../simple-dom/toolkit');

var e = toolkit.createElementCtor;
var attrs = toolkit.defineAttributeAccessors;

function selfClosing(el, val) {
  Object.defineProperty(el.prototype, '_selfClosing', {
    value: val === false ? false : true,
    configurable: true,
  });
}

var HTMLElement = e();
selfClosing(HTMLElement, false);
attrs(HTMLElement, [{'className': 'class'}, 'dir', 'id', 'lang', 'style', 'title']);
attrs(HTMLElement, [
  'onblur', 'onclick', 'ondblclick', 'onfocus', 'onkeydown', 'onkeypress', 'onkeyup', 'onmousedown',
  'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onresize']);

var HTMLAnchorElement = e(null, HTMLElement);
attrs(HTMLAnchorElement, [
  'accessKey', 'charset', 'coords', 'href', 'hreflang', 'name', 'rel', 'rev', 'shape', 'tabIndex',
  'target', 'text', 'type']);

var HTMLAppletElement = e(null, HTMLElement);
attrs(HTMLAppletElement, [
  'align', 'alt', 'archive', 'code', 'codeBase', 'height', 'hspace', 'name', 'object', 'vspace',
  'width']);

var HTMLAreaElement = e(null, HTMLElement);
selfClosing(HTMLAreaElement);
attrs(HTMLAreaElement, [
  'accessKey', 'alt', 'coords', 'href', 'hreflang', 'media', 'rel', 'relList', 'shape', 'tabIndex',
  'target', 'type']);

var HTMLBaseElement = e(null, HTMLElement);
selfClosing(HTMLBaseElement);
attrs(HTMLBaseElement, ['href', 'target']);

var HTMLBaseFontElement = e(null, HTMLElement);
selfClosing(HTMLBaseFontElement);
attrs(HTMLBaseFontElement, ['color', 'face', 'size']);

var HTMLBodyElement = e(null, HTMLElement);
attrs(HTMLBodyElement, ['aLink', 'background', 'bgColor', 'link', 'text', 'vLink']);
attrs(HTMLBodyElement, [
  'onafterprint', 'onbeforeprint', 'onbeforeunload', 'onerror', 'onhashchange', 'onload',
  'onmessage', 'onoffline', 'ononline', 'onpopstate', 'onresize', 'onstorage', 'onundo',
  'onunload']);

var HTMLBRElement = e(null, HTMLElement);
selfClosing(HTMLBRElement);
attrs(HTMLBRElement, ['clear']);

var HTMLButtonElement = e(null, HTMLElement);
attrs(HTMLButtonElement, [
  'accessKey', 'autofocus', 'disabled', 'name', 'tabIndex', 'type', 'value']);

var HTMLCanvasElement = e(null, HTMLElement);
attrs(HTMLCanvasElement, ['height', 'width']);

var HTMLDirectoryElement = e(null, HTMLElement);
attrs(HTMLDirectoryElement, ['compact']);

var HTMLDivElement = e(null, HTMLElement);
attrs(HTMLDirectoryElement, ['align']);

var HTMLDListElement = e(null, HTMLElement);
attrs(HTMLDListElement, ['compact']);

var HTMLEmbedElement = e(null, HTMLElement);
attrs(HTMLElement, ['height', 'src', 'type', 'width']);

var HTMLFieldSetElement = e(null, HTMLElement);
attrs(HTMLFieldSetElement, ['disabled', 'name']);

var HTMLFontElement = e(null, HTMLElement);
attrs(HTMLFontElement, ['color', 'face', 'size']);

var HTMLFormElement = e(null, HTMLElement);
attrs(HTMLFormElement, [
  'acceptCharset', 'action', 'autocomplete', {'encoding': 'enctype'}, 'enctype', 'method', 'name',
  'target']);
attrs(HTMLFormElement, ['onreset', 'onsubmit']);

var HTMLFrameElement = e(null, HTMLElement);
attrs(HTMLFrameElement, [
  'frameBorder', 'longDesc', 'marginHeight', 'marginWidth', 'name', 'noResize', 'scrolling',
  'src']);
attrs(HTMLFrameElement, ['onload']);

var HTMLFrameSetElement = e(null, HTMLElement);
attrs(HTMLFrameSetElement, ['cols', 'rows']);
attrs(HTMLFrameSetElement, ['onload']);

var HTMLHeadElement = e(null, HTMLElement);
attrs(HTMLHeadElement, ['profile']);

var HTMLHeadingElement = e(null, HTMLElement);
attrs(HTMLHeadingElement, ['align']);

var HTMLHtmlElement = e(null, HTMLElement);
attrs(HTMLHtmlElement, ['version']);

var HTMLHRElement = e(null, HTMLElement);
selfClosing(HTMLHRElement);
attrs(HTMLHRElement, ['align', 'noshade', 'size', 'width']);

var HTMLIFrameElement = e(null, HTMLElement);
attrs(HTMLIFrameElement, [
  'align', 'frameborder', 'height', 'longDesc', 'marginHeight', 'marginWidth', 'name', 'sandbox',
  'scrolling', 'seamless', 'src', 'width']);
attrs(HTMLIFrameElement, ['onload']);

var HTMLImageElement = e(null, HTMLElement);
selfClosing(HTMLImageElement);
attrs(HTMLImageElement, [
  'align', 'alt', 'border', 'height', 'longDesc', 'src', 'useMap', 'vspace', 'width']);
attrs(HTMLImageElement, ['onabort', 'onerror', 'onload']);

var HTMLInputElement = e(null, HTMLElement);
selfClosing(HTMLInputElement);
attrs(HTMLInputElement, [
  'accept', 'accessKey', 'align', 'alt', 'autocomplete', 'autofocus', 'checked', 'disabled',
  'height', 'maxLength', 'min', 'multiple', 'name', 'pattern', 'placeholder', 'readOnly',
  'required', 'size', 'src', 'tabIndex', 'useMap', 'value', 'width']);

var HTMLKeygenElement = e(null, HTMLElement);
attrs(HTMLKeygenElement, ['autofocus', 'challenge', 'disabled', 'keytype', 'name', 'type']);

var HTMLLabelElement = e(null, HTMLElement);
attrs(HTMLLabelElement, ['accessKey', {'htmlFor': 'for'}]);

var HTMLLIElement = e(null, HTMLElement);
attrs(HTMLLIElement, ['type', 'value']);

var HTMLLinkElement = e(null, HTMLElement);
selfClosing(HTMLLinkElement);
attrs(HTMLLinkElement, [
  'charset', 'disabled', 'href', 'hreflang', 'media', 'rel', 'rev', 'target', 'type']);

var HTMLMapElement = e(null, HTMLElement);
attrs(HTMLMapElement, ['name']);

var HTMLMenuElement = e(null, HTMLElement);
attrs(HTMLMenuElement, ['compact']);

var HTMLMetaElement = e(null, HTMLElement);
selfClosing(HTMLMetaElement);
attrs(HTMLMetaElement, ['content', 'httpEquiv', 'name', 'scheme']);

var HTMLModElement = e(null, HTMLElement);
attrs(HTMLModElement, ['cite', 'datetime']);

var HTMLObjectElement = e(null, HTMLElement);
attrs(HTMLObjectElement, [
  'align', 'archive', 'border', 'code', 'codeBase', 'codeType', 'data', 'height', 'hspace', 'name',
  'standby', 'tabIndex', 'type', 'useMap', 'vspace', 'width']);

var HTMLOListElement = e(null, HTMLElement);
attrs(HTMLOListElement, ['compact', 'start', 'type']);

var HTMLOptGroupElement = e(null, HTMLElement);
attrs(HTMLOptGroupElement, ['disabled', 'label']);

var HTMLOptionElement = e(null, HTMLElement);
attrs(HTMLOptionElement, ['defaultSelected', 'disabled', 'label', 'selected', 'text', 'value']);

var HTMLOutputElement= e(null, HTMLElement);
attrs(HTMLOutputElement, ['defaultValue', 'name', 'type', 'validationMessage', 'value']);

var HTMLParagraphElement = e(null, HTMLElement);
attrs(HTMLParagraphElement, ['align']);

var HTMLParamElement = e(null, HTMLElement);
attrs(HTMLParamElement, ['name', 'type', 'value', 'valueType']);

var HTMLPreElement = e(null, HTMLElement);
attrs(HTMLPreElement, ['width']);

var HTMLQuoteElement = e(null, HTMLElement);
attrs(HTMLQuoteElement, ['cite']);

var HTMLScriptElement = e(null, HTMLElement);
attrs(HTMLScriptElement, ['charset', 'defer', 'event', 'htmlFor', 'src', 'text', 'type']);

var HTMLSelectElement = e(null, HTMLElement);
attrs(HTMLSelectElement, [
  'autofocus', 'disabled', 'multiple', 'name', 'size', 'tabIndex', 'validationMessage']);

var HTMLSourceElement = e(null, HTMLElement);
attrs(HTMLSourceElement, ['media', 'src', 'type']);

var HTMLSpanElement = e(null, HTMLElement);

var HTMLStyleElement = e(null, HTMLElement);
attrs(HTMLStyleElement, ['media', 'type', 'disabled']);

var HTMLTableElement = e(null, HTMLElement);
attrs(HTMLTableElement, [
  'caption', 'align', 'bgColor', 'border', 'cellPadding', 'cellSpacing', 'frame', 'summary',
  'width']);

var HTMLTableCaptionElement = e(null, HTMLElement);
attrs(HTMLTableCaptionElement, ['align']);

var HTMLTableCellElement = e(null, HTMLElement);
attrs(HTMLTableCellElement, [
  'abbr', 'align', 'axis', 'bgColor', 'cellIndex', 'ch', 'chOff', 'headers', 'height', 'noWrap',
  'rowSpan', 'scope', 'vAlign', 'width']);

var HTMLTableDataCellElement = e(null, HTMLTableCellElement);
var HTMLTableHeaderCellElement = e(null, HTMLTableCellElement);

var HTMLTableColElement = e(null, HTMLElement);
attrs(HTMLTableColElement, ['align', 'ch', 'chOff', 'span', 'vAlign', 'width']);

var HTMLTableRowElement = e(null, HTMLElement);
attrs(HTMLTableRowElement, ['align', 'bgColor', 'ch', 'chOff', 'vAlign']);

var HTMLTableSectionElement = e(null, HTMLElement);
attrs(HTMLTableSectionElement, ['align', 'ch', 'chOff', 'vAlign']);

var HTMLTextAreaElement = e(null, HTMLElement);
attrs(HTMLTextAreaElement, [
  'accessKey', 'autofocus', 'cols', 'disabled', 'maxLength', 'readOnly', 'required', 'rows',
  'tabIndex', 'value']);

var HTMLTitleElement = e(null, HTMLElement);
attrs(HTMLTitleElement);

var HTMLUListElement = e(null, HTMLElement);
attrs(HTMLUListElement, ['compact', 'type']);

var HTMLMediaElement = e(null, HTMLElement);
attrs(HTMLMediaElement, ['autoplay', 'controls', 'loop', 'preload', 'src']);

var HTMLAudioElement = e(null, HTMLMediaElement);
var HTMLVideoElement = e(null, HTMLMediaElement);
attrs(HTMLVideoElement, ['height', 'poster', 'width']);

var HTMLUnknownElement = e(null, HTMLElement);

this.HTMLElement = HTMLElement;
this.HTMLAnchorElement = HTMLAnchorElement;
this.HTMLAppletElement = HTMLAppletElement;
this.HTMLAreaElement = HTMLAreaElement;
this.HTMLBaseElement = HTMLBaseElement;
this.HTMLBaseFontElement = HTMLBaseFontElement;
this.HTMLBodyElement = HTMLBodyElement;
this.HTMLBRElement = HTMLBRElement;
this.HTMLButtonElement = HTMLButtonElement;
this.HTMLCanvasElement = HTMLCanvasElement;
this.HTMLDirectoryElement = HTMLDirectoryElement;
this.HTMLDivElement = HTMLDivElement;
this.HTMLDListElement = HTMLDListElement;
this.HTMLEmbedElement = HTMLEmbedElement;
this.HTMLFieldSetElement = HTMLFieldSetElement;
this.HTMLFontElement = HTMLFontElement;
this.HTMLFormElement = HTMLFormElement;
this.HTMLFrameElement = HTMLFrameElement;
this.HTMLFrameSetElement = HTMLFrameSetElement;
this.HTMLHeadElement = HTMLHeadElement;
this.HTMLHeadingElement = HTMLHeadingElement;
this.HTMLHtmlElement = HTMLHtmlElement;
this.HTMLHRElement = HTMLHRElement;
this.HTMLIFrameElement = HTMLIFrameElement;
this.HTMLImageElement = HTMLImageElement;
this.HTMLInputElement = HTMLInputElement;
this.HTMLKeygenElement = HTMLKeygenElement;
this.HTMLLabelElement = HTMLLabelElement;
this.HTMLLIElement = HTMLLIElement;
this.HTMLLinkElement = HTMLLinkElement;
this.HTMLMapElement = HTMLMapElement;
this.HTMLMenuElement = HTMLMenuElement;
this.HTMLMetaElement = HTMLMetaElement;
this.HTMLModElement = HTMLModElement;
this.HTMLObjectElement = HTMLObjectElement;
this.HTMLOListElement = HTMLOListElement;
this.HTMLOptGroupElement = HTMLOptGroupElement;
this.HTMLOptionElement = HTMLOptionElement;
this.HTMLOutputElement = HTMLOutputElement;
this.HTMLParagraphElement = HTMLParagraphElement;
this.HTMLParamElement = HTMLParamElement;
this.HTMLPreElement = HTMLPreElement;
this.HTMLQuoteElement = HTMLQuoteElement;
this.HTMLScriptElement = HTMLScriptElement;
this.HTMLSelectElement = HTMLSelectElement;
this.HTMLSourceElement = HTMLSourceElement;
this.HTMLSpanElement = HTMLSpanElement;
this.HTMLStyleElement = HTMLStyleElement;
this.HTMLTableElement = HTMLTableElement;
this.HTMLTableCaptionElement = HTMLTableCaptionElement;
this.HTMLTableCellElement = HTMLTableCellElement;
this.HTMLTableDataCellElement = HTMLTableDataCellElement;
this.HTMLTableHeaderCellElement = HTMLTableHeaderCellElement;
this.HTMLTableColElement = HTMLTableColElement;
this.HTMLTableRowElement = HTMLTableRowElement;
this.HTMLTableSectionElement = HTMLTableSectionElement;
this.HTMLTextAreaElement = HTMLTextAreaElement;
this.HTMLTitleElement = HTMLTitleElement;
this.HTMLUListElement = HTMLUListElement;
this.HTMLMediaElement = HTMLMediaElement;
this.HTMLAudioElement = HTMLAudioElement;
this.HTMLVideoElement = HTMLVideoElement;
this.HTMLUnknownElement = HTMLUnknownElement;

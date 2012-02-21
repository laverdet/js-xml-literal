require('xml-literals').register('js');
var SimpleHTMLDOMXMLEnvironment = require('xml-literals/simple-html-dom');
XMLEnvironment.set(new SimpleHTMLDOMXMLEnvironment);	 
require('./main');

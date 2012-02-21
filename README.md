xml-literals(1) -- XML literals in Javascript
=============================================

INSTALLING
----------

To install xml-literals:

	npm install xml-literals


INTRODUCTION
------------

`xml-literals` adds support for XML literals to Javascript by means of simple code transformations.
If you are familiar with the E4X spec, this could be considered "E4X: The Good Parts". Since it is
based on desugaring syntax, you can use XML literals in _any_ Javascript environment
(Internet Explorer 6.0, Chrome 10, whatever). This library focuses on adding support to NodeJS, but
I'll include some hints as to how to get this to work in a browser.

Here's an example of an XML literal:

```
	var anchor = <a href={href}>Hello</a>;
```

This kind of syntax is more concise than something like:

```javascript
	var anchor = document.createElement('a');
	anchor.href = href;
	anchor.appendChild(document.createTextNode('Hello'));
```

And safer (and more flexible) than something like:

```javascript
	var anchor = '<a href="' +href +'">Hello</a>';
```

All literals which appear in your source code will go through an `XMLEnvironment` which defines how
the literal should be interpreted. This environment should interpret the literal into a constructor
for some other DOM. See the documentation in lib/environment.js for more information on
`XMLEnvironment`. `js-xml-literals` includes two environments for you to get started with. However
if you want to implement something interesting like element decomposition you will need to learn how
to create your own environment.


GETTING STARTED
---------------

The first step to get XML literals working in your project is to register which file extensions
should be transformed. If you want to allow XML literals in any Javascript file you would do this:

```javascript
	require('xml-literals').register('js');
```

This tells NodeJS to preprocess all *.js files with the XML literals transformation.

Unfortunately you won't be able to use XML literals in the file where you invoked the registration,
so this kind of thing won't work:

init.js:
```
	require('xml-literals').register('js');
	// WON'T WORK!!
	var test = <span>Hello</span>;
```

After registering a file extension you must setup the `XMLEnvironment`. If you want to use the
included simple-html-dom (recommended) you would do this:

```javascript
	var SimpleHTMLDOMXMLEnvironment = require('xml-literals/simple-html-dom');
	XMLEnvironment.set(new SimpleHTMLDOMXMLEnvironment);
```

Then just `require()` your main script and it will have XML literals enabled. simple-html-dom works
just like the DOM in your broswer, however it's simplified. Only basic DOM manipulation and querying
functions are available. If you are looking for a more full-featured server-side DOM I recommend
taking a look at `jsdom`, however you will incur a large performance penalty here. simple-html-dom
nodes include a toString() method, so you can convert your DOM to string to send to the browser
easily.

A quick example is included. [Hello
World](https://github.com/laverdet/js-xml-literal/tree/master/example)


IN THE BROWSER
--------------

If you want to get this running in your browser, include both `lib/environment.js` and
`lib/dom-environment.js`. Then run this: `XMLEnvironment.set(new DOMXMLEnvironment(document));`.

This step is probably the hardest. You have to run all your client-side JS through the xml-literals
desugaring function before sending it to the browser. The transformation function can be resolved
via `require('xml-literals/lib/desugar/desugar').desugar`. It's up to you how to implement this.
Easiest is probably to integrate it into your minification pipeline.

After you get that setup you can do magic like this:
```
	document.body.appendChild(<div><a href={uri}>It's Magic!</a></div>);
```

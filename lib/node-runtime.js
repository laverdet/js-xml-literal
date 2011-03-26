/**
 * js-dom-literal run time for NodeJS
 */
var desugar = require('../src/js-xml-literal').desugar;
global.XMLEnvironment = require('./environment').XMLEnvironment;

// Register which file extensions will pass through the desugarer
this.register = function(ext) {
	var fs = require('fs');
	var original = require.extensions['.' + ext];
	require.extensions['.' + ext] = function(module, filename) {
		var src = fs.readFileSync(filename, 'utf8');
		try {
			src = desugar(src);
		} catch(e) {
			throw new SyntaxError(filename + '\n' + e);
		}
		module._compile(src, filename);
	}
	require.extensions['.' + ext].original = original;
}

// Revert this file extension back to how it was before xml-literals overwrote the hook
this.unregister = function(ext) {
	require.extensions['.' + ext] = require.extensions['.' + ext].original;
}

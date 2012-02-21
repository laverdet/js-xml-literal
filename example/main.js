var http = require('http'), parseURL = require('url').parse;
http.createServer(function(req, res) {
	var uri = parseURL(req.url, true);

	// Generate body
	var body;
	if (uri.query.name) {
		// A tag with no name ( like <>this</> ) is a document fragment. When appended to another node
		// the child nodes themselves are appended one-by-one and then the document fragment is
		// discarded.
		body = <>
			<h1>Good to meet you!</h1>
			<p>Hello, {uri.query.name}. These are XML literals, enjoy.</p>
		</>;
	} else {
		body = <>
			<h1>Welcome!</h1>
			<form method="get" action="/">
				<p>What is your name?</p>
				<input type="input" name="name" /> <input type="submit" value="Introduce" />
			</form>
		</>;
	}

	// Generate document w/ doctype
	var document = '<!DOCTYPE html>' +
		<html>
			<head><title>xml-literals</title></head>
			<body>{body}</body>
		</html>;

	// Send response
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(document);
}).listen(1337);

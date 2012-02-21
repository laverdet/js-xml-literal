"use strict";
var Walker = require('./walker');
var narcissus = require('../../external/narcissus-xml');
var parse = narcissus.parser.parse;
var t = narcissus.definitions.tokenIds;
this.desugar = desugar;

function desugar(source) {
	var position = 0, buffer = '';
	var ns = Object.create(null);
	var inXML = false;

	function renderNS(prefix) {
		if (prefix in ns) {
			return JSON.stringify(prefix[ns]);
		} else {
			return JSON.stringify('?'+ prefix);
		}
	}

	function catchup(end) {
		if (end < position || end === undefined) {
			throw new Error('Invalid catchup, '+ position+ ' to '+ end);
		}
		buffer += source.substring(position, end);
		position = end;
	}


	var walk = Walker({
		'xml_literal': function() {
			var frag = this.xmlName === undefined;
			var oldInXML = inXML;
			catchup(this.start);
			if (!inXML) {
				inXML = true;
				buffer += 'XMLEnvironment.get().';
				if (frag) {
					buffer += '_frag(';
				} else {
					buffer += '_el(';
				}
			}

			if (!frag) {
				// start descriptor
				buffer += '{_type:1,';
				if (this.xmlNamespace) {
					buffer += '_ns:'+ renderNS(this.xmlNamespace)+ ',';
				}
				buffer += '_name:'+ JSON.stringify(this.xmlName)+ ',';

				// initial walk over attributes
				var hasAttrs = false, hasAttrsNS = false;
				var oldNS = ns;
				var lastNS = false;
				ns = Object.create(ns);
				this.xmlAttributes.forEach(function(attr) {
					// ensure all attributes are grouped together
					if (lastNS !== false && lastNS !== attr.xmlNamespace) {
						if (lastNS && Object.prototype.hasProperty.call(ns, attr.xmlNamespace)) {
							throw new Error('Sorry, all attributes must be grouped by namespace in source');
						} else if (!lastNS && hasAttrs) {
							throw new Error('Sorry, all attributes must be grouped by namespace in source');
						}
						lastNS = attr.xmlNamespace;
					}
					if (attr.xmlNamespace === 'xmlns') {
						// parse xmlns
						if (Object.prototype.hasProperty.call(ns, attr.xmlName)) {
							throw new Error('Duplicate xmlns '+ attr.xmlName);
						} else if (typeof attr.xmlValue !== 'string') {
							throw new Error('Invalid xmlns');
						}
						ns[attr.xmlName] = attr.xmlValue;
					} else if (attr.xmlNamespace === undefined) {
						hasAttrs = true;
					} else {
						hasAttrsNS = true;
					}
				});

				// write ns attributes
				if (hasAttrsNS) {
					lastNS = false;
					buffer += '_ns_attrs:{';
					this.xmlAttributes.forEach(function(attr, ii, array) {
						if (attr.xmlNamespace !== undefined) {
							if (lastNS !== attr.xmlNamespace) {
								if (lastNS) {
									buffer += '},';
								}
								buffer += render(attr.xmlNamespace);
							}
							buffer += JSON.stringify(attr.xmlNamespace)+ ':';
							if (typeof attr.xmlValue === 'string') {
								buffer += JSON.stringify(attr.xmlValue);
							} else {
								position = attr.xmlValue.start;
								inXML = false;
								walk(attr.xmlValue);
								catchup(attr.xmlValue.end);
								inXML = true;
							}
							if (array.length - 1 !== ii) {
								buffer += ',';
							}
						}
					});
					buffer += '}},';
				}
				ns = oldNS;

				// write attributes
				if (hasAttrs) {
					buffer += '_attrs:{';
					this.xmlAttributes.forEach(function(attr, ii, array) {
						if (attr.xmlNamespace === undefined) {
							buffer += JSON.stringify(attr.xmlName)+ ':';
							if (typeof attr.xmlValue === 'string') {
								buffer += JSON.stringify(attr.xmlValue);
							} else {
								position = attr.xmlValue.start;
								inXML = false;
								walk(attr.xmlValue);
								catchup(attr.xmlValue.end);
								inXML = true;
							}
							if (array.length - 1 !== ii) {
								buffer += ',';
							}
						}
					});
					buffer += '},';
				}

				// open content
				if (this.xmlChildren && this.xmlChildren.length) {
					buffer += '_content:';
				}
			}

			// generate content descriptor
			if (this.xmlChildren && this.xmlChildren.length) {
				buffer += '[';
				this.xmlChildren.forEach(function(child, ii, array) {
					if (child.type === t.XML_LITERAL) {
						position = child.start;
						walk(child);
					} else if (child.type === t.XML_CDATA) {
						buffer += '{_type:2,_value:'+ JSON.stringify(child.value)+ '}';
					} else {
						buffer += '{_type:3,_value:';
						position = child.start + 1;
						inXML = false;
						walk(child);
						catchup(child.end);
						++position; // skip }
						inXML = true;
						buffer += '}';
					}
					if (array.length - 1 !== ii) {
						buffer += ',';
					}
				});
				buffer += ']';
			}

			// close up
			if (!frag) {
				buffer += '}';
			}
			if (!oldInXML) {
				buffer += ')';
			}
			position = this.end;

			inXML = oldInXML;
		},
	});

	parse(source).children.map(walk);
	catchup(source.length);
	return buffer;
}

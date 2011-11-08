#include "desugar.h"
#include <libfbjs/parser.hpp>
#include <libfbjs/walker.hpp>
#include <stdarg.h>
#include <assert.h>
#include <iostream>
#include <map>
#include <set>
#include <stack>
#include <vector>
#include <boost/ptr_container/ptr_map.hpp>
#include <boost/foreach.hpp>
#define foreach BOOST_FOREACH
#define reverse_foreach BOOST_REVERSE_FOREACH

using namespace fbjs;
using namespace std;
namespace js_xml_literal {

const int TYPE_ELEMENT = 1;
const int TYPE_CDATA = 2;
const int TYPE_EXPR = 3;

class XMLDesugarWalker : public NodeWalker {
	typedef auto_ptr<XMLDesugarWalker> ptr;

	private:
		map<string, string>* ns_map;

		/**
		 * Creates a node that's like
		 * XMLEnvironment.get().<fn>(<args>)
		 */
		static Node* runtime_fn(const char* fn, const unsigned int va_count, ...) {
			Node* args = new NodeArgList;
			Node* call = (new NodeFunctionCall)
				->appendChild((new NodeStaticMemberExpression)
					->appendChild((new NodeFunctionCall)
						->appendChild((new NodeStaticMemberExpression)
							->appendChild(new NodeIdentifier("XMLEnvironment"))
							->appendChild(new NodeIdentifier("get")))
						->appendChild(new NodeArgList))
					->appendChild(new NodeIdentifier(fn)))
				->appendChild(args);

			va_list va_args;
			va_start(va_args, va_count);
			for (unsigned int ii = 0; ii < va_count; ++ii) {
				args->appendChild(va_arg(va_args, Node*));
			}
			va_end(va_args);
			return call;
		}

		/**
		 * Creates a NodeObjectLiteralProperty from a name and value
		 */
		static Node* object_property(const string &name, Node *val) {
			return (new NodeObjectLiteralProperty)
				->appendChild(new NodeStringLiteral(name, false))
				->appendChild(val);
		}

		/**
		 * Returns "undefined"
		 */
		static Node* undefined_literal() {
			return (new NodeUnary(VOID))->appendChild(new NodeNumericLiteral(0));
		}

		/**
		 * Creates an object literal property for an attributes map
		 */
		static Node* attr_object_property(const string &name, Node* val) {
			Node* right;
			if (dynamic_cast<NodeXMLTextData*>(val)) {
				right = new NodeStringLiteral(dynamic_cast<NodeXMLTextData*>(val)->data(), false);
			} else {
				assert(dynamic_cast<NodeXMLEmbeddedExpression*>(val));
				right = val->removeChild(val->childNodes().begin());
			}
			return object_property(name, right);
		}

		/**
		 * Return the namespace uri for this name
		 */
		string lookup_ns(const string &ns) {
			map<string, string>::iterator ii = ns_map->find(ns);
			if (ii == ns_map->end()) {
				return "?" + ns;
			} else {
				return ii->second;
			}
		}

	public:
		using NodeWalker::visit;

		XMLDesugarWalker() {}
		virtual NodeWalker* clone() const { return new XMLDesugarWalker(*this); }

		Node* walk(NodeProgram* node) {
			map<string, string> my_ns_map;
			ns_map = &my_ns_map;
			return NodeWalker::walk(node);
		}

		virtual void visit(NodeXMLName& node) {
			// Change XML names into string literals (always arguments to runtime functions)
			string ns = node.ns();
			if (!ns.empty()) {
				ns += ":";
			}
			ns += node.name();
			replace(new NodeStringLiteral(ns, false));
		}

		virtual void visit(NodeXMLElement& node) {
			// Rip this node apart
			NodeXMLName* name = dynamic_cast<NodeXMLName*>(node.removeChild(node.childNodes().begin()));
			Node* attrs = node.removeChild(node.childNodes().begin());
			Node* content = node.removeChild(node.childNodes().begin());
			NodeXMLName* close_name = dynamic_cast<NodeXMLName*>(node.removeChild(node.childNodes().begin()));

			// Fragment node? Skip everything below.
			if (name == NULL) {
				assert(attrs == NULL);
				assert(close_name == NULL);
				assert(!dynamic_cast<NodeXMLContentList*>(parent()->node()));
				node.appendChild(content);
				visitChildren();
				content = node.removeChild(node.childNodes().begin());
				replace(runtime_fn("_frag", 1, content));
				return;
			}

			// Find new namespaces defined on this node
			map<string, string> new_ns_map;
			if (attrs) {
				assert(dynamic_cast<NodeXMLAttributeList*>(attrs) != NULL);
				foreach (Node* ii, attrs->childNodes()) {
					NodeXMLName* key = dynamic_cast<NodeXMLName*>(ii->childNodes().front());
					Node* val = ii->childNodes().back();
					if (key->ns() == "xmlns") {
						if (new_ns_map.find(key->name()) != new_ns_map.end()) {
							throw runtime_error("duplicate ns defined on node");
						} else if (dynamic_cast<NodeXMLTextData*>(val) == NULL) {
							throw runtime_error("invalid xmlns value");
						}
						new_ns_map.insert(pair<string, string>(key->name(), dynamic_cast<NodeXMLTextData*>(val)->data()));
					}
				}
			}

			// Were there new namespaces defined?
			map<string, string> next_ns_map;
			map<string, string>* old_ns_map = NULL;
			if (!new_ns_map.empty()) {
				old_ns_map = ns_map;
				next_ns_map = *ns_map;
				next_ns_map.insert(new_ns_map.begin(), new_ns_map.end());
				ns_map = &next_ns_map;
			}

			// Create an object literal for non-namespaced attributes
			NodeObjectLiteral* attributes_descriptor = NULL;
			if (attrs) {
				foreach (Node* ii, attrs->childNodes()) {
					NodeXMLName* key = dynamic_cast<NodeXMLName*>(ii->childNodes().front());
					if (key->ns() != "") {
						continue;
					}
					if (attributes_descriptor == NULL) {
						attributes_descriptor = new NodeObjectLiteral;
					}
					attributes_descriptor->appendChild(attr_object_property(key->name(), ii->childNodes().back()));
				}
			}

			// Create an object literal for non-namespaced attributes
			Node* ns_attributes_descriptor = NULL;
			if (attrs) {
				map<string, NodeObjectLiteral*> ns_attr_nodes;
				foreach (Node* ii, attrs->childNodes()) {
					NodeXMLName* key = dynamic_cast<NodeXMLName*>(ii->childNodes().front());
					if (key->ns() == "" && key->ns() != "xmlns") {
						continue;
					}
					string ns = lookup_ns(key->ns());
					if (ns_attr_nodes.find(ns) == ns_attr_nodes.end()) {
						ns_attr_nodes.insert(pair<string, NodeObjectLiteral*>(ns, new NodeObjectLiteral));
					}
					NodeObjectLiteral* attr_desc = ns_attr_nodes.find(ns)->second;
					attr_desc->appendChild(attr_object_property(key->name(), ii->childNodes().back()));
				}
				if (!ns_attr_nodes.empty()) {
					ns_attributes_descriptor = new NodeObjectLiteral;
					typedef pair<string, NodeObjectLiteral*> pp;
					foreach (pp ii, ns_attr_nodes) {
						ns_attributes_descriptor->appendChild(object_property(ii.first, ii.second));
					}
				}
			}

			// Begin making a descriptor for this element
			assert(!close_name || (name->ns() == close_name->ns() && name->name() == close_name->name()));
			Node* desc = (new NodeObjectLiteral);
			desc->appendChild(object_property("_type", new NodeNumericLiteral(TYPE_ELEMENT)));
			if (name->ns() != "") {
				desc->appendChild(object_property("_ns", new NodeStringLiteral(lookup_ns(name->ns()), false)));
			}
			desc->appendChild(object_property("_name", new NodeStringLiteral(name->name(), false)));
			if (attributes_descriptor) {
				desc->appendChild(object_property("_attrs", attributes_descriptor));
			}
			if (ns_attributes_descriptor) {
				desc->appendChild(object_property("_ns_attrs", ns_attributes_descriptor));
			}
			node.appendChild(content);
			visitChildren();
			content = node.removeChild(node.childNodes().begin());
			desc->appendChild(object_property("_content", content));

			// Call runtime, or already part of a nested descriptor?
			if (!dynamic_cast<NodeXMLContentList*>(parent()->node())) {
				replace(runtime_fn("_el", 1, desc));
			} else {
				replace(desc);
			}

			// Reset ns?
			if (old_ns_map) {
				ns_map = old_ns_map;
			}
		}

		virtual void visit(NodeXMLContentList& node) {
			visitChildren();
			if (node.childNodes().empty()) {
				replace(undefined_literal());
				return;
			}
			Node* array_literal = new NodeArrayLiteral;
			node_list_t::iterator ii = node.childNodes().begin();
			while (ii != node.childNodes().end()) {
				array_literal->appendChild(node.removeChild(ii++));
			}
			replace(array_literal);
		}

		virtual void visit(NodeXMLTextData& node) {
			Node* value = new NodeStringLiteral(node.data(), false);
			if (dynamic_cast<NodeXMLAttribute*>(parent()->node())) {
				replace(value);
			} else {
				replace((new NodeObjectLiteral)
					->appendChild(object_property("_type", new NodeNumericLiteral(TYPE_CDATA)))
					->appendChild(object_property("_value", value)));
			}
		}

		virtual void visit(NodeXMLEmbeddedExpression& node) {
			visitChildren();
			Node* expr = node.removeChild(node.childNodes().begin());
			if (dynamic_cast<NodeXMLAttribute*>(parent()->node())) {
				replace(expr);
			} else {
				replace((new NodeObjectLiteral)
					->appendChild(object_property("_type", new NodeNumericLiteral(TYPE_EXPR)))
					->appendChild(object_property("_value", expr)));
			}
		}

		virtual void visit(NodeXMLAttributeList& node) {
			// Convert to a list of keys and a list of values, or undefined if no attrs
			visitChildren();
			if (node.childNodes().empty()) {
				replace(undefined_literal());
				return;
			}

			Node* keys = new NodeArrayLiteral;
			Node* vals = new NodeArrayLiteral;
			foreach (Node* ii, node.childNodes()) {
				Node* key = ii->removeChild(ii->childNodes().begin());
				Node* val = ii->removeChild(ii->childNodes().begin());
				keys->appendChild(key);
				if (dynamic_cast<NodeXMLTextData*>(val)) {
					vals->appendChild(
						new NodeStringLiteral(static_cast<NodeXMLTextData*>(val)->data(), false));
					delete val;
				} else {
					vals->appendChild(val);
				}
			}
			replace((new NodeObjectLiteral)
				->appendChild(object_property("_keys", keys))
				->appendChild(object_property("_vals", vals)));
		}
};

const string desugar(const string &code) {
	NodeProgram root(code.c_str(), (node_parse_enum)(
		PARSE_TYPEHINT | PARSE_OBJECT_LITERAL_ELISON | PARSE_E4X | PARSE_ACCESSORS));
	XMLDesugarWalker walker;
	assert(&root == walker.walk(&root));
	rope_t new_code = root.render(RENDER_PRETTY | RENDER_MAINTAIN_LINENO);
	return string(new_code.c_str());
}

}

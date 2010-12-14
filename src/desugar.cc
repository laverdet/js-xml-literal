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
namespace e4x_bump {

const int TYPE_ELEMENT = 1;
const int TYPE_CDATA = 2;
const int TYPE_EXPR = 3;

class XMLDesugarWalker : public NodeWalker {
  typedef auto_ptr<XMLDesugarWalker> ptr;

  private:
    int* for_each_count;

    /**
     * Creates a node that's like
     * __E4X.<fn>(<args>)
     */
    static Node* runtime_fn(const char* fn, const unsigned int va_count, ...) {
      Node* args = new NodeArgList;
      Node* call = (new NodeFunctionCall)
        ->appendChild((new NodeStaticMemberExpression)
          ->appendChild(new NodeIdentifier("__E4X"))
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
     * Returns a node for a local temporary variable
     */
    Node* tmp_varN() {
      // doesn't get automatically declared
      char buf[16];
      sprintf(buf, "__E4XFETMP%x", *for_each_count);
      ++*for_each_count;
      return new NodeIdentifier(buf);
    }

  public:
    using NodeWalker::visit;

    XMLDesugarWalker() {}
    virtual NodeWalker* clone() const { return new XMLDesugarWalker(*this); }

    Node* walk(NodeProgram* node) {
      auto_ptr<int> my_for_each_count(new int(0));
      for_each_count = my_for_each_count.get();
      return NodeWalker::walk(node);
    }

    virtual void visit(NodeForEachIn& node) {
      // for each (var ii in foo) {}
      // becomes
      // var tmp1 = foo; for (var tmp2 in tmp1) { var ii = tmp1[tmp2]; }
      ptr_vector ret_vector(visitChildren());
      Node* iterator = node.removeChild(node.childNodes().begin());
      Node* iterexpr = node.removeChild(node.childNodes().begin());
      Node* action = node.removeChild(node.childNodes().begin());
      Node* iterator_var = tmp_varN();
      Node* iterexpr_var = tmp_varN();
      Node* iterator_forward;

      if (dynamic_cast<NodeVarDeclaration*>(iterator)) {
        // var ii -> var ii = tmp1[tmp2];
        iterator_forward = iterator;
        iterator_forward->replaceChild((new NodeAssignment(ASSIGN))
          ->appendChild(iterator_forward->childNodes().front())
          ->appendChild((new NodeDynamicMemberExpression)
            ->appendChild(iterexpr_var)
            ->appendChild(iterator_var)),
          iterator_forward->childNodes().begin());
      } else {
        // ii -> ii = tmp1[tmp2];
        iterator_forward = (new NodeAssignment(ASSIGN))
          ->appendChild(iterator_forward)
          ->appendChild((new NodeDynamicMemberExpression)
            ->appendChild(iterexpr_var)
            ->appendChild(iterator_var));
      }

      replace((new NodeStatementList)
        ->appendChild((new NodeVarDeclaration)
          ->appendChild((new NodeAssignment(ASSIGN))
            ->appendChild(iterexpr_var->clone())
            ->appendChild(iterexpr)))
        ->appendChild((new NodeForIn)
          ->appendChild((new NodeVarDeclaration)->appendChild(iterator_var->clone()))
          ->appendChild(iterexpr_var->clone())
          ->appendChild((new NodeStatementList)
            ->appendChild(iterator_forward)
            ->appendChild(action))));
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
      // Decode XML literals into an object literal descriptor and pass that through ctorElement.
      visitChildren();

      Node* name = node.removeChild(node.childNodes().begin());
      Node* attrs = node.removeChild(node.childNodes().begin());
      Node* content = node.removeChild(node.childNodes().begin());
      Node* close_name = node.removeChild(node.childNodes().begin());

      if (name == NULL) {
        // XML list
        assert(attrs == NULL);
        assert(close_name == NULL);
        replace(content);
      } else {
        // XML element
        Node* new_node;
        if (close_name == NULL) {
          close_name = undefined_literal();
        }
        new_node = (new NodeObjectLiteral)
          ->appendChild(object_property("type", new NodeNumericLiteral(TYPE_ELEMENT)))
          ->appendChild(object_property("open", name))
          ->appendChild(object_property("close", close_name))
          ->appendChild(object_property("attributes", attrs))
          ->appendChild(object_property("content", content));
        if (!dynamic_cast<NodeXMLContentList*>(parent()->node())) {
          new_node = runtime_fn("ctorElement", 1, new_node);
        }
        replace(new_node);
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
          ->appendChild(object_property("type", new NodeNumericLiteral(TYPE_CDATA)))
          ->appendChild(object_property("value", value)));
      }
    }

    virtual void visit(NodeXMLEmbeddedExpression& node) {
      visitChildren();
      Node* expr = node.removeChild(node.childNodes().begin());
      replace((new NodeObjectLiteral)
        ->appendChild(object_property("type", new NodeNumericLiteral(TYPE_EXPR)))
        ->appendChild(object_property("value", expr)));
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
      foreach(Node* ii, node.childNodes()) {
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
        ->appendChild(object_property("keys", keys))
        ->appendChild(object_property("vals", vals)));
    }
};

const string bump(const string &code) {
  NodeProgram root(code.c_str(), (node_parse_enum)(PARSE_TYPEHINT | PARSE_OBJECT_LITERAL_ELISON | PARSE_E4X));
  XMLDesugarWalker walker;
  assert(&root == walker.walk(&root));
  rope_t new_code = root.render(RENDER_PRETTY | RENDER_MAINTAIN_LINENO);
  return string(new_code.c_str());
}

}

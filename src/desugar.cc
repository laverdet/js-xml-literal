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

/**
 * List of every XML method which will return another XML object. Any method not listed here is
 * assumed to return something other than XML.
 */
static const char* xml_methods_cstr[] = {
  "addNamespace", "appendChild", "attribute", "attributes", "child", "children", "comments",
  "copy", "descendants", "elements", "insertChildAfter", "insertChildBefore", "normalize",
  "parent", "processingInstructions", "prependChild", "removeNamespace", "replace",
  "setChildren", "text", "valueOf"
};
static set<string> xml_methods;
void init_xml_methods() {
  static bool init = false;
  if (!init) {
    init = true;
    for (size_t ii = 0; ii < sizeof(xml_methods_cstr) / sizeof(size_t); ++ii) {
      xml_methods.insert(xml_methods_cstr[ii]);
    }
  }
}

/**
 * Walks a NodeFunctionDeclaration or NodeFunctionExpression and finds all variables which have
 * been declared in this scope.
 */
class LocalScopeDiscovery : public NodeWalker {
  private:
    set<string>* vars;

    NodeIdentifier* identifier(Node* node) {
      if (dynamic_cast<NodeIdentifier*>(node)) {
        return static_cast<NodeIdentifier*>(node);
      } else if (dynamic_cast<NodeTypehint*>(node) || dynamic_cast<NodeAssignment*>(node)) {
        return identifier(static_cast<NodeIdentifier*>(node->childNodes().front()));
      } else {
        return NULL;
      }
    }

    void walkVarList(Node& node) {
      foreach (Node* ii, node.childNodes()) {
        NodeIdentifier* var = identifier(ii);
        if (var) {
          vars->insert(var->name());
        }
      }
    }

  public:
    using NodeWalker::visit;

    virtual NodeWalker* clone() const { return new LocalScopeDiscovery(*this); }

    static set<string> findLocalVars(Node& node) {
      set<string> my_vars;
      LocalScopeDiscovery walker;
      walker.vars = &my_vars;
      walker.walk(&node);
      return my_vars;
    }

    virtual void visit(NodeArgList& node) {
      walkVarList(node);
    }

    virtual void visit(NodeVarDeclaration& node) {
      walkVarList(node);
    }

    virtual void visit(NodeFunctionDeclaration& node) {
      NodeIdentifier* var = dynamic_cast<NodeIdentifier*>(node.childNodes().front());
      if (var != NULL) {
        vars->insert(var->name());
      }
    }

    virtual void visit(NodeFunctionExpression& node) {
      // Don't enter new scopes.
    }

    virtual void visit(NodeFunctionCall& node) {
      // Ensure all NodeArgList hits are for NodeFunctionDeclaration's
    }
};

/**
 * VarData contains data from an AST about variables or sub-expressions. We use this data to figure
 * out which expressions need to be treated as XML.
 */
class VarData {
  public:
    VarData(bool declared_xml = false, bool implied_non_xml = false, bool implied_xml = false) :
      declared_xml(declared_xml), implied_non_xml(implied_non_xml), implied_xml(implied_xml) {}
    int invasive_counter;
    bool declared_xml;
    bool implied_non_xml;
    bool implied_xml;
    set<VarData*> dependencies;

    void merge(const VarData& vd) {
      implied_non_xml = implied_non_xml || vd.implied_non_xml;
      implied_xml = implied_xml || vd.implied_xml || vd.declared_xml;
      foreach (VarData* dep, vd.dependencies) {
        dependencies.insert(dep);
      }
    }

    void set_declared_xml() {
      implied_xml =
      declared_xml = true;
    }
};

/**
 * XMLVarAnalysis walks an AST and attempts to figure out which variables will contain XML objects.
 */
typedef pair<Node*, string> js_variable_t;
typedef map<js_variable_t, VarData> vd_map_t;
class XMLVarAnalysis : public NodeWalker {
  typedef auto_ptr<XMLVarAnalysis> ptr;
  typedef boost::ptr_map<js_variable_t, VarData> vd_ptr_map_t;
  typedef map<string, VarData*> vd_ref_map_t;

  private:
    vd_ptr_map_t* vd_ptrs;
    vd_ref_map_t* vars;
    Node* global_scope;
    VarData var_data;

    VarData& varDataByIdentifier(string name) {
      vd_ref_map_t::iterator vd = vars->find(name);
      if (vd == vars->end()) {
        vd_ptr_map_t::iterator vd2 = vd_ptrs->find(js_variable_t(global_scope, name));
        if (vd2 == vd_ptrs->end()) {
          VarData* new_vd = new VarData;
          auto_ptr<VarData> new_vd_ptr(new_vd);
          vd_ptrs->insert(js_variable_t(global_scope, name), new_vd_ptr);
          return *new_vd;
        } else {
          return *vd2->second;
        }
      } else {
        return *vd->second;
      }
    }

    static void flattenVarData(VarData& root, VarData& child, int counter) {
      root.implied_non_xml = root.implied_non_xml || child.implied_non_xml;
      root.implied_xml = root.implied_xml || child.implied_xml || child.declared_xml;
      foreach (VarData* ii, child.dependencies) {
        if (ii->invasive_counter == counter) {
          continue;
        }
        ii->invasive_counter = counter;
        flattenVarData(root, *ii, counter);
      }
    }

  protected:
    virtual NodeWalker* clone() const { return new XMLVarAnalysis(*this); }

    void walkNewScope(Node& node) {
      set<string> local_vars = LocalScopeDiscovery::findLocalVars(node);
      vd_ref_map_t new_vars = *vars;
      foreach (string ii, local_vars) {
        auto_ptr<VarData> vd(new VarData);
        // lifetime managed by vd_ptrs in top instance
        new_vars.insert(vd_ref_map_t::value_type(ii, vd.get()));
        vd_ptrs->insert(js_variable_t(&node, ii), vd);
      }
      vars = &new_vars;
      visitChildren();
    }

  public:
    using NodeWalker::visit;

    virtual Node* walk(Node* node) {
      return NodeWalker::walk(node);
    }

    static vd_map_t scrapeVarData(NodeProgram& node) {
      // Create a walker and var data lists
      XMLVarAnalysis walker;
      vd_ptr_map_t vd_ptrs;
      vd_ref_map_t vars;
      walker.vd_ptrs = &vd_ptrs;
      walker.vars = &vars;
      walker.global_scope = &node;

      // Walk!
      walker.walk(&node);

      // Initialize invasize_counter to prevent cycles while resolving co-dependent variables
      foreach (vd_ptr_map_t::value_type ii, vd_ptrs) {
        ii.second->invasive_counter = 0;
      }

      // Loop through all dependencies for final var data information
      int counter = 0;
      vd_map_t all_vars;
      foreach (vd_ptr_map_t::value_type ii, vd_ptrs) {
        VarData& vd = *ii.second;
        flattenVarData(vd, vd, counter++);
        all_vars.insert(vd_map_t::value_type(
          ii.first,
          VarData(vd.declared_xml, vd.implied_non_xml, vd.implied_xml)
        ));
      }
      return all_vars;
    }

    virtual void visit(NodeProgram& node) {
      walkNewScope(node);
    }

    virtual void visit(NodeFunctionDeclaration& node) {
      walkNewScope(node);
    }

    virtual void visit(NodeFunctionExpression& node) {
      walkNewScope(node);
      var_data.implied_non_xml = true;
    }

    virtual void visit(NodeTypehint& node) {
      string name = static_cast<NodeIdentifier*>(node.childNodes().front())->name();
      string typehint = static_cast<NodeIdentifier*>(node.childNodes().back())->name();
      if (typehint == "XML" || typehint == "XMLList") {
        (*vars)[name]->set_declared_xml();
      }
    }

    //
    // Expressions
    virtual void visit(NodeOperator& node) {
      ptr_vector ret_vector(visitChildren());
      switch (node.operatorType()) {
        case COMMA:
          var_data = cast<XMLVarAnalysis>(ret_vector[1]).var_data;
          break;

        case PLUS: {
            // `+` returns XML if BOTH operands are XML
            VarData left_vd(cast<XMLVarAnalysis>(ret_vector[0]).var_data);
            VarData right_vd(cast<XMLVarAnalysis>(ret_vector[1]).var_data);
            var_data = left_vd;
            var_data.merge(right_vd);
            var_data.implied_xml = left_vd.implied_xml && right_vd.implied_xml;
            var_data.declared_xml = left_vd.declared_xml && right_vd.declared_xml;
          }
          break;

        case OR:
        case AND:
          // `&&` could actually just look at the last operand in some cases, but this is fine.
          var_data = cast<XMLVarAnalysis>(ret_vector[0]).var_data;
          var_data.merge(cast<XMLVarAnalysis>(ret_vector[1]).var_data);
          break;

        default:
          // other operators always return non-XML
          var_data.implied_non_xml = true;
          break;
      }
    }

    virtual void visit(NodeConditionalExpression& node) {
      ptr_vector ret_vector(visitChildren());
      var_data = cast<XMLVarAnalysis>(ret_vector[1]).var_data;
      var_data.merge(cast<XMLVarAnalysis>(ret_vector[2]).var_data);
    }

    virtual void visit(NodeParenthetical& node) {
      var_data = cast<XMLVarAnalysis>(visitChild(node.childNodes().begin()))->var_data;
    }

    virtual void visit(NodeAssignment& node) {
      ptr_vector ret_vector(visitChildren());
      Node* left = node.childNodes().front();
      if (dynamic_cast<NodeIdentifier*>(left)) {
        // If we're assigning to a variable (as opposed to a member expression, of `this`) we
        // should remember what is being put into the variable.
        string name = static_cast<NodeIdentifier*>(left)->name();
        VarData& vd = varDataByIdentifier(name);
        if (node.operatorType() == ASSIGN || node.operatorType() == PLUS_ASSIGN) {
          // `=` and `+=` can be used with XML
          vd.merge(cast<XMLVarAnalysis>(ret_vector[1]).var_data);
          var_data = cast<XMLVarAnalysis>(ret_vector[1]).var_data;
        } else {
          // All other assignment operators imply non-XML
          vd.implied_non_xml = true;
          var_data.implied_non_xml = true;
        }
      } else {
        if (node.operatorType() == ASSIGN || node.operatorType() == PLUS_ASSIGN) {
          // `=` and `+=` can be used with XML
          // Inherit va_data from the right side
          var_data = cast<XMLVarAnalysis>(ret_vector[1]).var_data;
        } else {
          // All other assignment operators imply non-XML
          var_data.implied_non_xml = true;
        }
      }
    }

    virtual void visitPrefixOrPostfix(Node& node) {
      visitChildren();
      Node* expr = node.childNodes().front();
      if (dynamic_cast<NodeIdentifier*>(expr)) {
        string name = static_cast<NodeIdentifier*>(expr)->name();
        VarData& vd = varDataByIdentifier(name);
        vd.implied_non_xml = true;
      }
      var_data.implied_non_xml = true;
    }

    virtual void visit(NodeUnary& node) {
      switch (node.operatorType()) {
        case INCR_UNARY:
        case DECR_UNARY:
          visitPrefixOrPostfix(node);
          break;

        default:
          visitChildren();
          var_data.implied_non_xml = true;
          break;
      }
    }

    virtual void visit(NodePostfix& node) {
      visitPrefixOrPostfix(node);
    }

    virtual void visit(NodeIdentifier& node) {
      string name = node.name();
      VarData& vd = varDataByIdentifier(name);
      var_data.dependencies.insert(&vd);
    }

    virtual void visitFunctionCallOrFunctionContructor(Node& node) {
      ptr_vector ret_vector(visitChildren());
      Node* left = node.childNodes().front();
      if (dynamic_cast<NodeStaticMemberExpression*>(left)) {
        // This is aware of NodeFunctionCall parents
        var_data = cast<XMLVarAnalysis>(ret_vector[0]).var_data;
      } else if (dynamic_cast<NodeIdentifier*>(left)) {
        string name = static_cast<NodeIdentifier*>(left)->name();
        if (name == "XML" || name == "XMLList") {
          var_data.set_declared_xml();
        }
      }
    }

    virtual void visit(NodeFunctionCall& node) {
      visitFunctionCallOrFunctionContructor(node);
    }

    virtual void visit(NodeFunctionConstructor& node) {
      visitFunctionCallOrFunctionContructor(node);
    }

    virtual void visit(NodeObjectLiteral& node) {
      visitChildren();
      var_data.implied_non_xml = true;
    }

    virtual void visit(NodeArrayLiteral& node) {
      visitChildren();
      var_data.implied_non_xml = true;
    }

    virtual void visitMemberExpression(Node& node) {
      Node* left = node.childNodes().front();
      while (
          dynamic_cast<NodeStaticMemberExpression*>(left) ||
          dynamic_cast<NodeDynamicMemberExpression*>(left)) {
        left = left->childNodes().front();
      }
      if (dynamic_cast<NodeIdentifier*>(left)) {
        string name = static_cast<NodeIdentifier*>(left)->name();
        VarData& vd = varDataByIdentifier(name);
        var_data = vd;
      }
    }

    virtual void visit(NodeStaticMemberExpression& node) {
      ptr_vector ret_vector(visitChildren());
      Node* right = node.childNodes().back();
      if (dynamic_cast<NodeFunctionCall*>(parent()->node())) {
        init_xml_methods();
        set<string>::iterator ii = xml_methods.find(static_cast<NodeIdentifier*>(right)->name());
        if (ii != xml_methods.end()) {
          var_data = cast<XMLVarAnalysis>(ret_vector[0]).var_data;
          return;
        }
      }
      visitMemberExpression(node);
    }

    virtual void visit(NodeDynamicAttributeIdentifier& node) {
      visitChildren();
      visitMemberExpression(node);
    }

    virtual void visit(NodeXMLElement& node) {
      visitChildren();
      var_data.set_declared_xml();
    }

    virtual void visit(NodeFilteringPredicate& node) {
      visitChildren();
      var_data.set_declared_xml();
    }

    virtual void visit(NodeDescendantExpression& node) {
      visitChildren();
      var_data.set_declared_xml();
    }
};

class XMLDesugarWalker : public NodeWalker {
  typedef auto_ptr<XMLDesugarWalker> ptr;

  private:
    bool requires_tmp;
    bool requires_tmp2;
    int* for_each_count;
    vd_map_t* vars;
    XMLDesugarWalker* scope;
    VarData var_data;

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
     * Creates a node that's like:
     * <obj>.<fn>(<args>)
     */
    static Node* method_call(Node* obj, const char* fn, const unsigned int va_count, ...) {
      Node* args = new NodeArgList;
      Node* call = (new NodeFunctionCall)
        ->appendChild((new NodeStaticMemberExpression)
          ->appendChild(obj)
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

    #define safe_method_call(var_data, obj, fn, cnt, ...) \
      ((var_data).declared_xml || ((var_data).implied_xml && !(var_data).implied_non_xml) ? \
        method_call(obj, fn, cnt, __VA_ARGS__) : \
        runtime_fn(fn, cnt + 1, obj, __VA_ARGS__))

    /**
     * Uses "," operator to set the current default before executing an expression
     * which may need the default namespace.
     */
    static Node* default_namespace_expr(Node* node) {
      return (new NodeParenthetical)->appendChild(
        (new NodeOperator(COMMA))
          ->appendChild(runtime_fn("setDefaultNamespace", 1,
            new NodeIdentifier("__defaultNamespace")))
          ->appendChild(node));
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
    Node* tmp_var() {
      scope->requires_tmp = true;
      return new NodeIdentifier("__E4XTMP");
    }
    Node* tmp_var2() {
      scope->requires_tmp =
      scope->requires_tmp2 = true;
      return new NodeIdentifier("__E4XTMP2");
    }
    Node* tmp_varN() {
      // doesn't get automatically declared
      char buf[16];
      sprintf(buf, "__E4XFETMP%x", *for_each_count);
      ++*for_each_count;
      return new NodeIdentifier(buf);
    }

    /**
     * A bunch of expressions together in ()'s with commas in between
     */
    Node* comma_atom(const unsigned int va_count, ...) {
      node_list_t list;
      va_list va_args;
      va_start(va_args, va_count);
      for (unsigned int ii = 0; ii < va_count; ++ii) {
        list.push_back(va_arg(va_args, Node*));
      }
      va_end(va_args);
      Node* atom = list.back();
      list.pop_back();
      reverse_foreach(Node* ii, list) {
        atom = (new NodeOperator(COMMA))->appendChild(ii)->appendChild(atom);
      }
      return (new NodeParenthetical)->appendChild(atom);
    }

  public:
    using NodeWalker::visit;

    XMLDesugarWalker() {}
    virtual NodeWalker* clone() const { return new XMLDesugarWalker(*this); }

    Node* walk(NodeProgram* node) {
      vd_map_t my_vars(XMLVarAnalysis::scrapeVarData(*node));
      auto_ptr<int> my_for_each_count(new int(0));
      for_each_count = my_for_each_count.get();
      vars = &my_vars;
      scope = this;
      return NodeWalker::walk(node);
    }

    virtual void walkNewScope(Node& node, Node& statements) {
      requires_tmp =
      requires_tmp2 = false;
      scope = this;
      visitChildren();
      if (requires_tmp) {
        Node* decl = (new NodeVarDeclaration)->appendChild(tmp_var());
        if (requires_tmp2) {
          decl->appendChild(tmp_var2());
        }
        statements.prependChild(decl);
      }
    }

    virtual void visit(NodeProgram& node) {
      walkNewScope(node, *node.childNodes().front());
    }

    virtual void visit(NodeFunctionDeclaration& node) {
      walkNewScope(node, *node.childNodes().back());
    }

    virtual void visit(NodeFunctionExpression& node) {
      walkNewScope(node, *node.childNodes().back());
    }

    virtual void visit(NodeOperator& node) {
      ptr_vector ret_vector(visitChildren());
      switch (node.operatorType()) {
        case NOT_EQUAL:
        case EQUAL: {
          VarData& left_ret = cast<XMLDesugarWalker>(ret_vector[0]).var_data;
          VarData& right_ret = cast<XMLDesugarWalker>(ret_vector[1]).var_data;
          Node* new_node = NULL;
          if (left_ret.implied_xml || right_ret.implied_xml) {
            Node* left = node.removeChild(node.childNodes().begin());
            Node* right = node.removeChild(node.childNodes().begin());
            if (left_ret.declared_xml) {
              new_node = method_call(left, "_equals", 1, right);
            } else if (right_ret.declared_xml) {
              new_node = method_call(right, "_equals", 1, left);
            } else {
              new_node = runtime_fn("_equals", 2, left, right);
            }
            if (node.operatorType() == NOT_EQUAL) {
              new_node = (new NodeUnary(NOT_UNARY))->appendChild(new_node);
            }
            replace(new_node);
          }
          break;
        }

        default:;
      }
    }

    virtual void visit(NodeAssignment& node) {
      ptr_vector ret_vector(visitChildren());
      Node* left = node.childNodes().front();
      Node* right = node.childNodes().back();
      XMLDesugarWalker& left_ret = cast<XMLDesugarWalker>(ret_vector[0]);
      XMLDesugarWalker& right_ret = cast<XMLDesugarWalker>(ret_vector[1]);

      // In case we're assigning to XML, that has to go through the runtime.
      if ((dynamic_cast<NodeDynamicMemberExpression*>(left) ||
          dynamic_cast<NodeStaticMemberExpression*>(left)) &&
          left_ret.var_data.implied_xml) {
        Node* object = left->removeChild(left->childNodes().begin());
        Node* idx = left->removeChild(left->childNodes().begin());
        node.childNodes().pop_back(); // save `right` from ~NodeAssignment
        if (dynamic_cast<NodeStaticMemberExpression*>(left) && dynamic_cast<NodeIdentifier*>(idx)) {
          Node* tmp = new NodeStringLiteral(static_cast<NodeIdentifier*>(idx)->name(), false);
          delete idx;
          idx = tmp;
        }
        if (node.operatorType() == ASSIGN) {
          // Simple assignment
          replace(safe_method_call(left_ret.var_data, object, "_put", 2, idx, right));
        } else {
          // Compound assignment :(
          node_operator_t op;
          switch (node.operatorType()) {
            case MULT_ASSIGN:
              op = MULT;
              break;
            case DIV_ASSIGN:
              op = DIV;
              break;
            case MOD_ASSIGN:
              op = MOD;
              break;
            case PLUS_ASSIGN:
              op = PLUS;
              break;
            case MINUS_ASSIGN:
              op = MINUS;
              break;
            case LSHIFT_ASSIGN:
              op = LSHIFT;
              break;
            case RSHIFT_ASSIGN:
              op = RSHIFT;
              break;
            case RSHIFT3_ASSIGN:
              op = RSHIFT3;
              break;
            case BIT_AND_ASSIGN:
              op = BIT_AND;
              break;
            case BIT_XOR_ASSIGN:
              op = BIT_XOR;
              break;
            case BIT_OR_ASSIGN:
              op = BIT_OR;
              break;
            case ASSIGN:;
          }
          // `object` and `idx` may have side-effects:
          //   XML(this.getE4X())[this.getIdx()] += 5;
          // thus we must memoize them
          replace(
            comma_atom(3,
              (new NodeAssignment(ASSIGN))->appendChild(tmp_var())->appendChild(object),
              (new NodeAssignment(ASSIGN))->appendChild(tmp_var2())->appendChild(idx),
              safe_method_call(left_ret.var_data, tmp_var(), "_put", 2, tmp_var2(),
                (new NodeOperator(op))
                  ->appendChild(safe_method_call(left_ret.var_data, tmp_var(), "_get", 1, tmp_var2()))
                  ->appendChild(right)
              )
          ));
        }
      }
      var_data = cast<XMLDesugarWalker>(right_ret).var_data;
    }

    virtual void visit(NodeTypehint& node) {
      // Kill all XML typehints
      string typehint = static_cast<NodeIdentifier*>(node.childNodes().back())->name();
      if (typehint == "XML" || typehint == "XMLList") {
        replace(node.removeChild(node.childNodes().begin()));
      }
    }

    virtual void visitFunctionCallOrConstructor(Node& node) {
      visitChildren();
      Node* call = node.childNodes().front();
      NodeIdentifier* id;

      if ((id = dynamic_cast<NodeIdentifier*>(call))) {
        if (id->name() == "QName") {
          // QName constructor may need the default namespace. Note that this will fail if you
          // call QName by any other name, but that's crazy.
          // turns "new QName(foo)" into "new (..., QName)(foo)
          node.replaceChild(default_namespace_expr(call), node.childNodes().begin());
        } else if (id->name() == "XML" || id->name() == "XMLList") {
          var_data.set_declared_xml();
        }
      }
    }

    virtual void visit(NodeFunctionCall& node) {
      visitFunctionCallOrConstructor(node);
    }

    virtual void visit(NodeFunctionConstructor& node) {
      visitFunctionCallOrConstructor(node);
    }

    virtual void visitMemberExpression(Node& node) {
      ptr_vector ret_vector(visitChildren());
      XMLDesugarWalker& left_ret = cast<XMLDesugarWalker>(ret_vector[0]);
      if (left_ret.var_data.implied_xml ||
          (dynamic_cast<NodeStaticMemberExpression*>(&node) &&
            cast<XMLDesugarWalker>(ret_vector[1]).var_data.implied_xml)) {
        NodeWalker* top = parent();
        NodeWalker* next = this;
        while (dynamic_cast<NodeParenthetical*>(top->node())) {
          next = top;
          top = top->parent();
        }
        if (dynamic_cast<NodeFunctionCall*>(top->node())) {
          // If this member expression is being invoked in the context of a function call we skip
          // this rewrite step.
          // i.e.:
          // foo.bar.toXMLString()
          // should not become:
          // foo.bar._get('toXMLString')()
          if (dynamic_cast<NodeStaticMemberExpression*>(&node)) {
            // Some methods will return XML, some will not. Attempt to figure out if this will be
            // XML.
            Node* right = node.childNodes().back();
            init_xml_methods();
            set<string>::iterator ii =
              xml_methods.find(static_cast<NodeIdentifier*>(right)->name());
            if (ii != xml_methods.end()) {
              var_data = left_ret.var_data;
            }
          }
          return;
        } else if (dynamic_cast<NodeAssignment*>(top->node()) &&
            top->node()->childNodes().front() == next->node()) {
          // Also skip the rewrite if this is beign used for an assignment expression.
          // Don't turn:
          //   foo.bar = 5
          // into:
          //   foo._get('bar') = 5
          // This will be handled in NodeAssignment. However, be sude to turn:
          //   etc = foo.bar
          // into:
          //   etc = foo._get('bar')
          var_data = left_ret.var_data;
          return;
        }

        // foo.bar
        // becomes:
        // get(foo, 'bar')
        Node* left = node.removeChild(node.childNodes().begin());
        Node* right = node.removeChild(node.childNodes().begin());
        if (dynamic_cast<NodeStaticMemberExpression*>(&node) &&
            dynamic_cast<NodeIdentifier*>(right)) {
          Node* tmp = new NodeStringLiteral(dynamic_cast<NodeIdentifier*>(right)->name(), false);
          delete right;
          right = tmp;
        }
        replace(safe_method_call(left_ret.var_data, left, "_get", 1, right));
        var_data = left_ret.var_data;
      }
    }

    virtual void visit(NodeStaticMemberExpression& node) {
      visitMemberExpression(node);
    }

    virtual void visit(NodeDynamicMemberExpression& node) {
      visitMemberExpression(node);
    }

    virtual void visit(NodeIdentifier& node) {
      // Inherit data from XMLVarAnalysis. This is the Ice-Nine that makes expressions run through
      // the E4X runtime.
      vd_map_t::iterator vd = vars->find(js_variable_t(scope->node(), node.name()));
      if (vd != vars->end()) {
        var_data.declared_xml = vd->second.declared_xml;
        var_data.implied_non_xml = vd->second.implied_non_xml;
        var_data.implied_xml = vd->second.implied_xml;
      }
    }

    virtual void visit(NodeForEachIn& node) {
      // for each (var ii in foo) {}
      // becomes
      // var tmp1 = foo; for (var tmp2 in tmp1) { var ii = tmp1[tmp2]; }
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

    virtual void visit(NodeXMLDefaultNamespace& node) {
      // Memoize this in a local variable
      replace((new NodeVarDeclaration)
        ->appendChild((new NodeAssignment(ASSIGN))
          ->appendChild(new NodeIdentifier("__defaultNamespace"))
          ->appendChild(runtime_fn("createDefaultNamespace", 1,
            node.removeChild(node.childNodes().begin())))));
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
        replace(default_namespace_expr(runtime_fn("ctorList", 1, content)));
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
          new_node = default_namespace_expr(runtime_fn("ctorElement", 1, new_node));
        }
        replace(new_node);
      }
      var_data.set_declared_xml();
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

    virtual void visit(NodeWildcardIdentifier& node) {
      replace(new NodeStringLiteral("*", false));
    }

    virtual void visit(NodeStaticAttributeIdentifier& node) {
      // Convert to a string, which will be passed into the runtime by other rewrite rules.
      Node* val = node.childNodes().front();
      if (dynamic_cast<NodeIdentifier*>(val) != NULL) {
        // Identifier like foo.@bar
        Node* name = new NodeStringLiteral(static_cast<NodeIdentifier*>(val)->name(), false);
        replace(runtime_fn("attrIdentifier", 1, name));
      } else {
        // Always a wild card: foo.@*
        replace(runtime_fn("attrWildcard", 0));
      }
      var_data.set_declared_xml();
    }

    virtual void visit(NodeDynamicAttributeIdentifier& node) {
      // @[foo]
      // becomes:
      // attrIdentifier(foo)
      visitChildren();
      Node* expr = node.removeChild(node.childNodes().begin());
      replace(runtime_fn("attrIdentifier", 1, expr));
      var_data.set_declared_xml();
    }

    virtual void visit(NodeFilteringPredicate& node) {
      // foo.(true)
      // becomes:
      // foo._filter(function() { return true; })
      //
      // Note: This is quite an incomplete implementation. A lot of work will have to go into
      // simulating an augmented scope chain. This construct is essentially a with(){} block in
      // sheep's clothing.
      visitChildren();
      Node* left = node.removeChild(node.childNodes().begin());
      Node* right = node.removeChild(node.childNodes().begin());
      right = (new NodeFunctionExpression)
        ->appendChild(NULL)
        ->appendChild(new NodeArgList)
        ->appendChild((new NodeStatementWithExpression(RETURN))
          ->appendChild(right));
      replace(method_call(left, "_filter", 1, right));
      var_data.set_declared_xml();
    }

    virtual void visit(NodeDescendantExpression& node) {
      // foo..bar
      // becomes:
      // foo._descendants('bar')
      visitChildren();
      Node* left = node.removeChild(node.childNodes().begin());
      Node* right = node.removeChild(node.childNodes().begin());
      replace(method_call(left, "_descendants", 1, right));
      var_data.set_declared_xml();
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

#include <node/node.h>
#include <libfbjs/node.hpp>
#include "desugar.h"

using namespace std;
using namespace v8;
using namespace node;

Handle<Value> E4XDesugar(const Arguments& args) {
  HandleScope scope;
  if (args.Length() < 1) {
    return ThrowException(Exception::TypeError(String::New("requires an argument.")));
  }
  String::Utf8Value src(args[0]->ToString());
  try {
    string desugared(e4x_bump::bump(*src));
    return scope.Close(String::New(desugared.c_str()));
  } catch (fbjs::ParseException& ex) {
    return ThrowException(Exception::SyntaxError(String::New(ex.what())));
  }
}

extern "C" void init(Handle<Object> target) {
  NODE_SET_METHOD(target, "desugar", E4XDesugar);
}

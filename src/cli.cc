#include <stdlib.h>
#include <iostream>
#include <string>
#include <sstream>
#include <libfbjs/node.hpp>
#include "desugar.h"

using namespace std;

int main() {
  stringbuf buf;
  cin >> noskipws >> &buf;
  try {
    cout <<e4x_bump::bump(buf.str()) <<"\n";
    return 0;
  } catch (fbjs::ParseException& ex) {
    cout <<ex.what() <<"\n";
    return 1;
  }
}

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
		cout <<js_xml_literal::desugar(buf.str()) <<"\n";
		return 0;
	} catch (fbjs::ParseException& ex) {
		cout <<ex.what() <<"\n";
		return 1;
	}
}

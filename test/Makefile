all: moz-tests

moz-tests: mozilla-1.9.2/js/src/tests/e4x/jstests.list
	NODE_PATH='../runtime:../src' node run-tests.js $^ | \
	  egrep --line-buffered '^ PASSED!|^ FAILED!|^begin test' | tee $@ | cut -c-80

mozilla-1.9.2/js/src/tests/e4x/jstests.list:
	@echo 'This is about to fetch Firefox from Mozilla.org!'
	@while [[ $$R != 'y' ]]; do \
	  read -p 'Are you sure you want to do this? (y \ n) ' R; \
	  if [[ $$R == 'n' ]]; then exit 1; fi \
	done
	curl -O 'ftp://ftp.mozilla.org/pub/mozilla.org/firefox/releases/latest/source/firefox-3.6.11.source.tar.bz2'
	tar -xvf firefox-3.6.11.source.tar.bz2 mozilla-1.9.2/js/src/tests
	rm -f firefox-3.6.11.source.tar.bz2

.PHONY: moz-tests

/*
curl -O 'ftp://ftp.mozilla.org/pub/mozilla.org/firefox/releases/latest/source/firefox-3.6.11.source.tar.bz2'
tar -xvf firefox-3.6.11.source.tar.bz2 mozilla-1.9.2/js/src/tests
NODE_PATH='../runtime:../src' node run-tests.js mozilla-1.9.2/js/src/tests/jstests.list

marcel@marcel ~/Code/e4x-bump/test $ NODE_PATH='../runtime:../src' node run-tests.js -s mozilla-1.9.2/js/src/tests/shell.js mozilla-1.9.2/js/src/tests/e4x/shell.js mozilla-1.9.2/js/src/tests/e4x/Expressions/shell.js mozilla-1.9.2/js/src/tests/e4x/Expressions/11.1.1.js 

mozilla-1.9.2/js/src/tests/shell.js
*/

var
  fs = require('fs'),
  path = require('path'),
  sys = require('sys'),
  spawn = require('child_process').spawn;

function beget(obj) {
  function F(){}
  F.prototype = obj;
  return new F;
}

var argv = process.argv.slice(2);
if (argv[0] === '-s') {
  // Run test mode. Setup an environment for E4X, and run the files.
  var files = argv.slice(1), code = [], pending = 0;
  files.push('pre-run.js');
  for (var ii in files) {
    ~function(ii) {
      code.push('');
      ++pending;
      fs.readFile(files[ii], function(err, data) {
        if (err) {
          throw new Error;
        }
        --pending;
        code[ii] = data;
        if (!pending) {
          runTest();
        }
      });
    }(ii);
  }

  // Run all the files in global scope
  function runTest() {
    require('runtime');
    global.require = require;
    var
      desugar = require('e4x-bump').desugar,
      Script = process.binding('evals').Script,
      overlay = new Script(desugar(code.pop()), 'pre-run.js');
    for (var ii in code) {
      overlay.runInThisContext();
      var test;
      try {
        test = new Script(desugar(code[ii]), files[ii]);
      } catch(e) {
        sys.print(' FAILED! Failed to compile ' + files[ii] + '\n');
        sys.print(e + '\n');
      }
      try {
        test.runInThisContext();
      } catch(e) {
        sys.print(' FAILED! ' + e.stack + '\n');
      }
    }
  }
} else {
  // Parse a test list and run those tests
  var proc, pending = [];
  for (var ii in argv) {
    var stack = [];
    var origin = process.cwd() + '/' + argv[ii];
    try {
      while (fs.statSync(path.dirname(origin) + '/shell.js')) {
        stack.push(path.dirname(origin) + '/shell.js');
        origin = path.dirname(origin);
      }
    } catch(e) {}
    handleList(argv[ii], stack.reverse());
  }

  // Reading is done synchronously as an easy way to keep order consistent
  function handleList(list, stack) {
    var data = fs.readFileSync(list, 'utf8').split(/\n/g);
    var val;
    for (var ii in data) {
      if (val = (/^include (.+)$/.exec(data[ii]) || [])[1]) {
        stack.push(path.dirname(list) + '/shell.js');
        handleList(path.dirname(list) + '/' + val, stack);
        stack.pop();
      } else if (val = (/^script (.+)$/.exec(data[ii]) || [])[1]) {
        var args = [process.argv[1], '-s'];
        for (var ii = 0; ii < stack.length; ++ii) {
          args.push(stack[ii]);
        }
        args.push(path.dirname(list) + '/' + val);
        runCommand(process.execPath, args);
      }
    }
  }

  // Keeps a queue of commands and runs them in order
  function runCommand(executable, args) {
    if (executable) {
      pending.push([executable, args]);
    }
    if (!proc && pending.length) {
      proc = spawn.apply(null, pending.shift());

      proc.stdout.on('data', function(data) {
        sys.print(data);
      });

      proc.stderr.on('data', function(data) {
        sys.print(data);
      });

      proc.on('exit', function(code) {
        if (code) {
          sys.print('exited with code ' + code + '\n');
        }
        proc = null;
        runCommand();
      });
    }
  }
}

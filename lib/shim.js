// jshint node:false, browser:true

(function (global) {
  'use strict';

  var messages = {};

  var jasmine = global.jasmine;

  if (!/^2\./.test(jasmine.version)) {
    console.log('\x1b[33m%s\x1b[0m', 'jasmine 1 shim is meant for jasmine 2');
    return;
  }

  function deprecated(message, f) {
    return function () {
      messages[message] = true;
      return f.apply(this, arguments);
    };
  }

  function breaking(message) {
    return function () {
      messages['BREAKING: ' + message] = true;
      throw new Error(message);
    };
  }

  jasmine.getEnv().beforeEach(function () {
    this.addMatchers = addLegacyMatchers;

    var env = jasmine.getEnv();
    var currentSpec = this;
    Object.defineProperty(env, 'currentSpec', {
      configurable: true,
      get: deprecated('use this instead of jasmine.getEnv().currentSpec', function () {
        return currentSpec;
      })
    });
  });

  jasmine.getEnv().afterAll(function () {
    var errors = Object.keys(messages);
    if (errors.length) {
      [
        '',
        'W A R N I N G !!!',
        '',
        'Your test code uses functions, methods, and properties that are no longer available in Jasmine version 2:',
        'See http://jasmine.github.io/2.3/upgrading.html for upgrade guide.',
        ''
      ].forEach(function (line) {
        if (global.__karma__) {
          global.__karma__.log('JASMINE v2', [line]);
        } else {
          console.log('\x1b[33m%s\x1b[0m', line);
        }
      });
      errors.forEach(function (line) {
        if (global.__karma__) {
          global.__karma__.log('JASMINE v2', [line]);
        } else {
          console.log('\x1b[33mJASMINE v2 %s\x1b[0m', line);
        }
      });
    }
  });

  var hooked = jasmine.objectContaining;
  jasmine.objectContaining = function () {
    var result = hooked.apply(this, arguments);
    result.jasmineMatches = deprecated('use asymmetricMatch instead of jasmineMatches',
                                       result.asymmetricMatch.bind(result));
    return result;
  };

  var fit = global.fit;
  var fdescribe = global.fdescribe;

  global.iit = deprecated('use fit() (focused it) instead of iit()', fit);
  global.ddescribe = deprecated('use fdescribe() (focused describe) instead of ddescribe()', fdescribe);

  function addLegacyMatchers(matchers) {
    Object.keys(matchers).forEach(function (name) {
      messages['Matcher ' + name + ' should be upgraded'] = true;
      var original = matchers[name];
      matchers[name] = function () {
        return {
          compare: function (actual) {
            var args = [].slice.call(arguments, 1);
            var thisObj = { actual: actual };
            var result = {
              pass: original.apply(thisObj, args)
            };
            if (thisObj.message) {
              thisObj.isNot = result.pass;
              original.apply(thisObj, args);
              result.message = thisObj.message();
              if (result.message.constructor === Array) {
                result.message = result.message[Number(result.pass)];
              }
            }
            return result;
          }
        };
      };
    });
    jasmine.addMatchers(matchers);
  }

  function spyShim(spy) {
    spy.reset = deprecated('use spy.calls.reset() instead of spy.reset()', function () {
      return spy.calls.reset();
    });

    Object.defineProperty(spy, 'mostRecentCall', {
      get: deprecated('use spy.calls.mostRecent() instead of spy.mostRecentCall', function () {
        return spy.calls.mostRecent();
      })
    });

    Object.defineProperty(spy, 'identity', {
      get: deprecated('use spy.and.identity() instead of spy.identity', function () {
        return spy.and.identity();
      })
    });

    spy.andCallThrough = deprecated('use spy.and.callThrough() instead of spy.andCallThrough()', function () {
      return spy.and.callThrough.apply(spy.and, arguments);
    });

    spy.andReturn = deprecated('use spy.and.returnValue() instead of spy.andReturn()', function () {
      return spy.and.returnValue.apply(spy.and, arguments);
    });

    spy.andCallFake = deprecated('use spy.and.callFake() instead of spy.andCallFake()', function () {
      return spy.and.callFake.apply(spy.and, arguments);
    });

    spy.andThrow = deprecated('use spy.and.throwError() instead of spy.andThrow()', function () {
      return spy.and.throwError.apply(spy.and, arguments);
    });

    var calls = spy.calls;

    Object.defineProperty(spy, 'callCount', {
      get: deprecated('use spy.calls.count() instead of spy.callCount', function () {
        return calls.count();
      })
    });

    Object.defineProperty(calls, '0', {
      get: deprecated('use spy.calls.first() instead of spy.calls[0]', function () {
        return calls.first();
      })
    });

    ['1','2','3','4','5','6','7','8','9'].forEach(function (n) {
      Object.defineProperty(calls, n, {
        get: deprecated(
          'use spy.calls.all() instead of spy.calls; to access call count or' +
            ' arguments see count() or argsFor() methods',
          function () {
            return calls.all()[n];
          }
        )
      });
    });

    Object.defineProperty(spy, 'argsForCall', {
      get: deprecated('use calls.argsFor() or calls.allArgs() instead of argsForCall', function () {
        return calls.allArgs();
      })
    });

    Object.defineProperty(calls, 'length', {
      get: deprecated('use spy.calls.count() instead of spy.calls.length', function () {
        return calls.count();
      })
    });

    ['pop', 'shift', 'forEach'].forEach(function (f) {
      Object.defineProperty(calls, f, {
        get: deprecated('use spy.calls.all() instead of spy.calls to access calls array', function () {
          return calls.all()[f].bind(calls.all());
        })
      });
    });

    return spy;
  }

  var createSpy = jasmine.createSpy;
  jasmine.createSpy = function () {
    return spyShim(createSpy.apply(this, arguments));
  };

  jasmine.Clock.useMock = breaking(
    'use jasmine.clock().install() instead of jasmine.Clock.useMock(), ' +
    'you must uninstall clock when not needed with jasmine.clock().uninstall()'
  );

  jasmine.Clock.tick = deprecated('use jasmine.clock().tick() instead of jasmine.Clock.tick()', function (t) {
    return jasmine.clock().tick(t);
  });

  var originalIt = global.it,
      shimmedQueue = [],
      noop = function () {};

  global.runs = deprecated('"runs" is deprecated, use done callback instead', function (fn) {
    shimmedQueue.push({
      fn: fn,
      delay: 0,
      message: undefined,
      breakingPoint: undefined
    });
  });

  global.waits = deprecated('"waits" is deprecated, use done callback instead', function (millis) {
    shimmedQueue.push({
      fn: noop,
      delay: millis || jasmine.DEFAULT_TIMEOUT_INTERVAL,
      message: undefined,
      breakingPoint: undefined
    });
  });

  global.waitsFor = deprecated('"waitsFor" is deprecated, use done callback instead', function () {
    var job = {
      fn: noop,
      delay: 0,
      message: undefined,
      breakingPoint: jasmine.DEFAULT_TIMEOUT_INTERVAL
    };
    for (var i = 0; i < arguments.length; i++) {
      switch (typeof arguments[i]) {
        case 'function': job.fn            = arguments[i]; break;
        case 'string'  : job.message       = arguments[i]; break;
        case 'number'  : job.breakingPoint = arguments[i]; break;
      }
    }
    shimmedQueue.push(job);
  });

  function processQueue(items, done) {
    var item = items.shift();
    if (item) {
      setTimeout(function () {
        processQueueItem(item, items, done);
      }, item.delay);
    } else {
      done();
    }
  }

  function processQueueItem(item, items, done) {
    if (item.breakingPoint === undefined) {
      item.fn();
      processQueue(items, done);
    } else {

      var elapsedTime = 0,
          watchInterval = 10;

      var watcher = setInterval(function () {
        if (item.fn()) {
          clearInterval(watcher);
          processQueue(items, done);
        } else {
          elapsedTime += watchInterval;
          if (elapsedTime > item.breakingPoint) {
            clearInterval(watcher);
            global.fail(item.message ? item.message :
              'Asynchronous task execution took more time "' + elapsedTime + '" than expected "' + item.breakingPoint + '"');
            done();
          }
        }
      }, watchInterval);
    }
  }

  global.it = function (desc, fn, timeout) {
    shimmedQueue.splice(0, shimmedQueue.length);
    originalIt(desc, function (done) {
      fn.apply(this, arguments);
      processQueue(shimmedQueue, done);
    }, timeout);
  };

}(typeof window === 'object' ? window : global));

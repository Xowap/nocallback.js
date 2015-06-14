var exports = {};

if (window) {
    window.nocallback = exports;
}

(function (exports) {
    'use strict';

    var FailValue,
        fail,
        exceptionHandler,
        coroutine,
        sleep,
        waitDocumentReady,
        waitEvent,
        setExceptionHandler;

    FailValue = function (value) {
        this.value = value;
    };

    fail = function (value) {
        return new FailValue(value);
    };

    exceptionHandler = function (x) {
        console.error(x.stack);
    };

    coroutine = function (fn) {
        function run(err, it) {
            var tick;

            tick = function (prev, resolve, reject) {
                var cur;

                try {
                    cur = it.next(prev);

                    if (cur.done) {
                        if (cur.value instanceof FailValue) {
                            reject(cur.value.value);
                        } else {
                            resolve(cur.value);
                        }

                        return;
                    }

                    cur.value.then(
                        function () {
                            tick({
                                success: true,
                                args: arguments
                            }, resolve, reject);
                        },
                        function () {
                            tick({
                                success: false,
                                args: arguments
                            }, resolve, reject);
                        }
                    );
                } catch (e) {
                    if (e.stack && err.stack) {
                        e.stack += '\n\nCoroutine call stack trace:\n'
                            + err.stack;
                    }

                    if (exceptionHandler) {
                        exceptionHandler(e);
                    } else {
                        throw e;
                    }
                }
            };

            return new Promise(function (resolve, reject) {
                tick(undefined, resolve, reject);
            });
        }

        return function () {
            return run(new Error, fn.apply(null, arguments));
        }
    };

    sleep = function (timeMsec) {
        return new Promise(function (resolve) {
            setTimeout(resolve, timeMsec);
        });
    };

    waitDocumentReady = function () {
        return new Promise(function (resolve) {
            if (document.readyState != 'loading') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
            }
        });
    };

    waitEvent = function (element, eventName) {
        return new Promise(function (resolve) {
            var handler;

            handler = function (event) {
                element.removeEventListener(eventName, handler);
                resolve(event);
            };

            element.addEventListener(eventName, handler);
        });
    };

    setExceptionHandler = function (fn) {
        exceptionHandler = fn;
    };

    exports.coroutine = coroutine;
    exports.sleep = sleep;
    exports.fail = fail;
    exports.waitDocumentReady = waitDocumentReady;
    exports.waitEvent = waitEvent;
    exports.setExceptionHandler = setExceptionHandler;
}(exports));

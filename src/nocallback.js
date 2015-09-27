/*!
 * nocallback.js
 *
 * Copyright Rémy Sanchez <remy.sanchez@hyperthese.net>
 * Licenced under the terms of the WTFPL
 */

var exports = {};

if (window) {
    window.nocallback = exports;
}

(function (exports) {
    'use strict';

    var FailValue,
        fail,
        cancelablePromise,
        exceptionHandler,
        coroutine,
        sleep,
        waitDocumentReady,
        waitEvent,
        waitJQueryEvent,
        select,
        setExceptionHandler;

    FailValue = function (value) {
        this.value = value;
    };

    fail = function (value) {
        return new FailValue(value);
    };

    cancelablePromise = function (resolver, onCancel) {
        var canceled = false,
            actualResolver,
            promise;

        actualResolver = function (resolve, reject) {
            resolver(function () {
                if (!canceled) {
                    resolve.apply(null, arguments);
                }
            }, function () {
                if (!canceled) {
                    reject.apply(null, arguments);
                }
            })
        };

        promise = new Promise(actualResolver);
        promise.cancel = function () {
            canceled = true;

            if (onCancel) {
                onCancel();
            }
        };

        return promise;
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
        return cancelablePromise(function (resolve) {
            setTimeout(resolve, timeMsec);
        });
    };

    waitDocumentReady = function () {
        return cancelablePromise(function (resolve) {
            if (document.readyState != 'loading') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
            }
        });
    };

    waitEvent = function (element, eventName) {
        var handler;

        return cancelablePromise(function (resolve) {
            handler = function (event) {
                element.removeEventListener(eventName, handler);
                resolve(event);
            };

            element.addEventListener(eventName, handler);
        }, function () {
            element.removeEventListener(eventName, handler);
        });
    };

    waitJQueryEvent = function ($element, eventName, selector, callback) {
        var handler;

        if (typeof selector === 'function' && !callback) {
            callback = selector;
            selector = undefined;
        }

        return cancelablePromise(function (resolve) {
            handler = function (event) {
                $element.off(eventName, selector, handler);
                resolve(event);

                if (callback) {
                    callback.apply(this, arguments);
                }
            };

            $element.on(eventName, selector, handler);
        }, function () {
            $element.off(eventName, selector, handler);
        });
    };

    select = function (handlers) {
        var cleanup = function () {
            handlers.forEach(function (handler) {
                handler[0].cancel();
            });
        };

        return new Promise(function (resolve, reject) {
            handlers.forEach(function (handler) {
                var promise = handler[0],
                    callback = coroutine(handler[1]);

                promise.then(function () {
                    callback({
                        success: true,
                        args: arguments
                    }).then(resolve, reject);
                    cleanup();
                }, function () {
                    callback({
                        success: false,
                        args: arguments
                    }).then(resolve, reject);
                    cleanup();
                })
            });
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
    exports.waitJQueryEvent = waitJQueryEvent;
    exports.select = select;
    exports.setExceptionHandler = setExceptionHandler;
}(exports));

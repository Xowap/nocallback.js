(function (exports) {
    'use strict';

    var FailValue,
        exceptionHandler,
        fail,
        coroutine,
        sleep;

    FailValue = function (value) {
        this.value = value;
    };

    fail = function (value) {
        return new FailValue(value);
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

    exports.coroutine = coroutine;
    exports.sleep = sleep;
    exports.fail = fail;

    function test() {
        var doShit = coroutine(function* doShit() {
                //var result = yield $.get('data.json');

                return fail('fail!');

                //if (result.success) {
                //    return result.args[0];
                //}
            }),
            doMoreShit = coroutine(function* doMoreShit(extra) {
                var result = yield doShit(),
                    data;

                if (result.success) {
                    data = result.args[0];
                    data.extra = extra;
                    console.log('done shit', data);
                } else {
                    console.log('shit not done', result.args);
                }
            });

        doMoreShit('bonjour');
    }

    test();

    exceptionHandler = function (x) {
        console.log(x.stack);
    }
}({}));

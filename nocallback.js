(function (exports) {
    'use strict';

    var exceptionHandler,
        coroutine,
        sleep;

    coroutine = function (fn) {
        function run(err, it) {
            var tick;

            tick = function (prev, resolve) {
                var cur;

                try {
                    cur = it.next(prev);

                    if (cur.done) {
                        resolve(cur.value);
                        return;
                    }

                    cur.value.then(
                        function () {
                            tick({
                                success: true,
                                args: arguments
                            }, resolve);
                        },
                        function () {
                            tick({
                                success: false,
                                args: arguments
                            }, resolve);
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

            return new Promise(function (resolve) {
                tick(undefined, resolve);
            });
        }

        return function () {
            return run(new Error, fn());
        }
    };

    sleep = function (timeMsec) {
        return new Promise(function (resolve) {
            setTimeout(resolve, timeMsec);
        });
    };

    exports.coroutine = coroutine;
    exports.sleep = sleep;

    function test() {
        var doShit = coroutine(function* doShit() {
                var result = yield $.get('data.json');

                if (result.success) {
                    return result.args[0];
                }
            }),
            doMoreShit = coroutine(function* doMoreShit() {
                var result = yield doShit();

                if (result.success) {
                    console.log('done shit', result.args[0]);
                }
            });

        doMoreShit();
    }

    test();

    exceptionHandler = function (x) {
        console.log(x.stack);
    }
}({}));

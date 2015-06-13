(function ($) {
    'use strict';

    var exceptionHandler,
        coroutine;

    coroutine = function (fn) {
        function run(err, it) {
            var tick;

            tick = function (prev) {
                var cur;

                try {
                    cur = it.next(prev);

                    if (cur.done) {
                        return;
                    }

                    cur.value.then(
                        function () {
                            tick({
                                success: true,
                                args: arguments
                            });
                        },
                        function () {
                            tick({
                                success: false,
                                args: arguments
                            })
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

            (function () {
                tick();
            }());
        }

        return function () {
            return run(new Error, fn());
        }
    };

    function test() {
        var doShit = coroutine(function* doShit() {
            var result = yield $.get('data.json');

            if (result.success) {
                console.log('success', result);
            } else {
                console.log('fail');
            }

            result = yield $.get('pouet.json');

            if (result.success) {
                console.log('success', result);
            } else {
                console.log('fail', result);
            }

            throw new Error('woops');
        });

        doShit();
        doShit();
    }

    test();

    exceptionHandler = function (x) {
        console.log(x.stack);
    }
}(jQuery));

(function ($) {
    'use strict';

    function coroutine(fn) {
        var tick,
            it;

        tick = function (prev) {
            var cur = it.next(prev);

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
        };

        return function () {
            it = fn();
            tick();
        }
    }

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
    }

    test();
}(jQuery));

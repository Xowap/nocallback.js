nocallback.coroutine(function* () {
    'use strict';

    var checkForm,
        displayErrors,
        main;

    checkForm = nocallback.coroutine(function* () {
        var emailRe = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i,
            event,
            email = document.getElementById('email'),
            errors = [];

        event = yield nocallback.waitEvent(
            document.getElementById('form'),
            'submit'
        );
        event.args[0].preventDefault();

        if (email.value === '') {
            errors.push('Email address is required');
        } else if (!emailRe.test(email.value)) {
            errors.push(email.value + ' is not a valid email address');
        }

        if (errors.length) {
            return nocallback.fail(errors);
        }
    });

    displayErrors = function (errors) {
        var element = document.getElementById('errors'),
            error,
            i,
            line;

        element.innerHTML = '';

        if (errors.length) {
            element.style.display = 'block';

            for (i = 0; i < errors.length; i += 1) {
                error = errors[i];
                line = document.createElement('li');
                line.innerText = error;
                element.appendChild(line);
            }
        } else {
            element.style.display = 'none';
        }
    };

    main = nocallback.coroutine(function* () {
        var invalid = true,
            errors;

        yield nocallback.waitDocumentReady();

        while (invalid) {
            errors = yield checkForm();

            if (errors.success) {
                invalid = false;
            } else {
                displayErrors(errors.args[0]);
            }
        }

        document.getElementById('form').style.display = 'none';
        document.getElementById('success').style.display = 'block';
    });

    main();
})();

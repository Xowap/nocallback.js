nocallback.js
=============

Async JS without callbacks. Get things simple again.

Use ES6's generators in order to write async code but keep a simple control
flow, free of callbacks hell. It just looks like it's synchronous, but it isn't!

```javascript
    var data = yield $.get('data.json');
    
    if (data.success) {
        console.log('got data', data.args[0]);
    } else {
        console.log('failed to get data');
    }
```

Did you notice? Here you use a typical jQuery get request, but without giving
any callback!

## Usage

Two main concepts operate here: coroutines and promises.

A coroutine is a function that will execute async code, wrapped in
`nocallback.js`'s thin layer of magic.

It uses a generator in order to interrupt the control flow by yielding
promises, and start it again when the promise resolves.

### Simple use

Here's an example:

```javascript
var doStuff = nocallback.couroutine(function* () {
    console.log('hello...');
    yield nocallback.sleep(1000);
    console.log('world!');
});
```

### Returned object

Promise results are returned in an object in the form of:

```javacript
{
    'success': /* true if resolved, false if rejected */,
    'args': /* list of arguments given to resolve/reject */
}
```

### Coroutine from coroutine

Coroutines do actually return promises, so you can use a coroutine from a
coroutine. To complete the previous example:

```javascript
var doOtherStuff = nocallback.coroutine(function* () {
    yield doStuff();
    console.log('world has been greeted');
});
```

### Return values

As coroutines return promises, reaching the end of a coroutine results in
resolving the promise. If you provide a return value, it will be given as
argument to the promise resolution.

```javascript
var doSomething = nocallback.coroutine(function* () {
        return 42;
    }),
    doSomethingMore = nocallback.coroutine(function* () {
        var answer = yield doSomething();
        console.log(answer.args[0]); // --> 42
    });
    
doSomethingMore();
```

You can also reject the promise, with a special fail value

```javascript
var doSomething = nocallback.coroutine(function* () { 
    return nocallback.fail('did not work');
});
```

### Complete example

You can find a complete working example in `example/app.js`.

## Inspiration

This project is basically inspired by [Task.js](http://taskjs.org/) and Python's
[asyncio](https://docs.python.org/3.4/library/asyncio.html).

Although it uses the same technique as `Task.js`, it has a different goal and a
different API. `Task.js` tried to be a pseudo-thread, whereas here the focus
is just on having a simple library that allows you to use and combine 
`coroutines`.

## Compatibility

As-is, the lib is compatible with the latest versions of Google Chrome and
Firefox.

Compatibility with older browsers can be achieved with an ES6 transpiler, like
Babel.

## Licence

This project is available under the terms of the WTFPL. See the file COPYING for
more details.

Contributor(s):

- Rémy Sanchez

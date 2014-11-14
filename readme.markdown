# page-bus

share an event emitter among pages and frames on the same domain

This module works offline and does not rely on any network IO.

Behind the scenes, a
[SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)
loads from a Blob turned into a worker url with `URL.createObjectURL()`
and this worker relays messages. The URL is saved in localStorage so that other
pages can load the same URL properly.

Tested in recentish builds of firefox and chrome. It might work in IE11 who
knows.

# example

Just create a bus, which returns an event emitter:

``` js
var createBus = require('page-bus');
var bus = createBus();

bus.on('hello', function (msg) {
    console.log('msg=', msg);
});

bus.emit('hello', Date.now());
```

Compile with browserify then open this page up on a few tabs.

The messages get shared hooray!

[Check out the demo on neocities.](https://substack.neocities.org/pagebus.html)

# methods

``` js
var createBus = require('page-bus')
```

## var bus = createBus(namespace='default')

Create a new event emitter `bus` under a string `namespace`.

All other pages on the same domain in the same browser will be able to open the
event emitter.

# special events

## bus.on('_connect', function (blobUrl) {})

When the connection is established, this event fires with the underlying blob
url to the shared worker code.

## bus.on('_retry', function (times) {})

This event fires for every internal retry event with the counter `times` during
initialization. Listening to this event can be useful for debugging.

# install

With [npm](https://npmjs.org) do:

```
npm install page-bus
```

# license

MIT

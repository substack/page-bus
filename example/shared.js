var ports = [];

self.addEventListener('connect', function (e) {
    var port = e.ports[0];
    ports.push(port);
    port.addEventListener('message', function (e) {
        ports.forEach(function (p, ix) {
            p.postMessage('HELLO! ' + e.data + ' [' + ix + ']')
        });
    }, false);
    port.start();
}, false);

var EventEmitter = require('events').EventEmitter;
var isarray = require('isarray');

module.exports = function (namespace) {
    if (!namespace) namespace = 'default';
    
    var prefix = '_pageBus!' + namespace + '!';
    var code = new Blob(
        [ '(' + worksrc + ')()' ],
        { type: 'text/javascript' }
    );
    
    var ucode = localStorage.getItem(prefix + 'URL');
    if (!ucode) ucode = URL.createObjectURL(code);
    
    var times = 0;
    function createWorker (cb) {
        try { var worker = new SharedWorker(ucode, namespace) }
        catch (err) {
            ucode = null;
            return setTimeout(function () {
                ucode = getOrLoad();
                createWorker(cb);
            }, Math.min(++times * 50, 500));
        }
        worker.port.addEventListener('message', onmessage);
        
        var to = setTimeout(function () {
            // DEAD, try again
            worker.port.removeEventListener('message', onmessage);
            ucode = getOrLoad();
            createWorker(cb);
        }, Math.min(++times * 50, 500));
        worker.port.start();
        
        function onmessage (msg) {
            worker.port.removeEventListener('message', onmessage);
            clearTimeout(to);
            cb(worker);
        }
    }
    
    function getOrLoad () {
        var ncode = localStorage.getItem(prefix + 'URL');
        if (ucode !== ncode) {
            return ncode; // a worker was set up elsewhere
        }
        return URL.createObjectURL(code);
    }
    
    var emitter = new EventEmitter;
    var queue = [];
    emitter.emit = function () {
        queue.push(arguments);
        return emitter;
    };
    
    createWorker(function (w) {
        localStorage.setItem(prefix + 'URL', ucode);
        w.port.addEventListener('message', function (ev) {
            if (isarray(ev.data) && ev.data[0] === prefix) {
                EventEmitter.prototype.emit.apply(emitter, ev.data.slice(1));
            }
        });
        emitter.emit = function () {
            var args = [].slice.call(arguments);
            args.unshift(prefix);
            w.port.postMessage(args);
            return emitter;
        };
        queue.forEach(function (q) {
            emitter.emit.apply(emitter, q);
        });
        queue = null;
    });
    return emitter;
};

function worksrc () {
    var ports = [];
    self.addEventListener('connect', function (e) {
        var port = e.ports[0];
        ports.push(port);
        
        port.postMessage('_sharedWorkerBusHello');
        port.addEventListener('message', function (e) {
            for (var j = 0; j < ports.length; j++) {
                ports[j].postMessage(e.data);
            }
        }, false);
        port.start();
    }, false);
}

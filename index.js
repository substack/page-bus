var EventEmitter = require('events').EventEmitter;
var isarray = require('isarray');

module.exports = function () {
    var prefix = '_pageBus!';
    var times = 0;
    
    (function retry () {
        var ucode = localStorage.getItem(prefix + 'URL');
        if (!ucode) ucode = createURL();
        
        try { var worker = new SharedWorker(ucode) }
        catch (err) { setTimeout(retry, Math.min(++times * 100, 500)) }
        
        var to = setTimeout(ontimeout, Math.min(++times * 100, 500));
        worker.port.addEventListener('message', onmessage);
        worker.port.start();
        
        function onmessage (msg) {
            worker.port.removeEventListener('message', onmessage);
            clearTimeout(to);
            
            if (localStorage.getItem(prefix + 'URL') !== ucode) {
                console.log('fuck fuck fuck');
                retry();
            }
            else onworker(worker, ucode);
        }
        
        function ontimeout () {
            // DEAD, try again
            worker.port.removeEventListener('message', onmessage);
            if (times > 5 && ucode === localStorage.getItem(prefix + 'URL')) {
                localStorage.removeItem(prefix + 'URL');
            }
            retry();
        }
    })();
    
    var emitter = new EventEmitter;
    var queue = [];
    emitter.emit = function () {
        queue.push(arguments);
        return emitter;
    };
    return emitter;
    
    function createURL () {
        var code = new Blob(
            [ '(' + worksrc + ')()' ],
            { type: 'text/javascript' }
        );
        var ucode = URL.createObjectURL(code);
        localStorage.setItem(prefix + 'URL', ucode);
        return ucode;
    }
    
    function onworker (w, ucode) {
        emitter.emit('_connect', ucode);
        
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
    }
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

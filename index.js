var EventEmitter = require('events').EventEmitter;
var isarray = require('isarray');
var inherits = require('inherits');

module.exports = PageBus;
inherits(PageBus, EventEmitter);

function PageBus () {
    if (!(this instanceof PageBus)) return new PageBus;
    var self = this;
    var prefix = '_pageBus!';
    var times = 0;
    EventEmitter.call(this);
    this._queue = [];
    
    (function retry () {
        var ucode = localStorage.getItem(prefix + 'URL');
        if (!ucode) ucode = createURL();
        
        try { var worker = new SharedWorker(ucode) }
        catch (err) { return setTimeout(retry, Math.min(++times * 100, 500)) }
        
        var to = setTimeout(ontimeout, Math.min(++times * 100, 500));
        worker.port.addEventListener('message', onmessage);
        worker.port.start();
        
        function onmessage (msg) {
            worker.port.removeEventListener('message', onmessage);
            clearTimeout(to);
            
            if (localStorage.getItem(prefix + 'URL') !== ucode) {
                retry();
            }
            else onworker(worker, ucode);
        }
        
        function ontimeout () {
            // DEAD, try again
            worker.port.removeEventListener('message', onmessage);
            EventEmitter.prototype.emit.call(self, '_retry', times);
            if (times > 5 && ucode === localStorage.getItem(prefix + 'URL')) {
                localStorage.removeItem(prefix + 'URL');
            }
            retry();
        }
    })();
    
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
        EventEmitter.prototype.emit.call(self, '_connect', ucode);
        w.port.addEventListener('message', function (ev) {
            if (isarray(ev.data) && ev.data[0] === prefix) {
                EventEmitter.prototype.emit.apply(self, ev.data.slice(1));
            }
        });
        self._queue.forEach(function (q) {
            EventEmitter.prototype.emit.apply(self, q);
        });
        self._w = w;
        self._queue = null;
    }
    
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
}

PageBus.prototype.emit = function () {
    if (this.queue) {
        this._queue.push(arguments);
        return this;
    }
    var args = [].slice.call(arguments);
    args.unshift(this._prefix);
    this._w.port.postMessage(args);
    return this;
};

var code = new Blob([ '(' + worksrc + ')()' ], { type: 'text/javascript' });

var ucode = localStorage.getItem('_sharedWorkerBusURL');
if (!ucode) {
    ucode = URL.createObjectURL(code);
    localStorage.setItem('_sharedWorkerBusURL', ucode);
}

function createWorker (cb) {
    var ready = false;
    var worker = new SharedWorker(ucode);
    worker.port.addEventListener('message', onmessage);
    var to = setTimeout(function () {
        worker.port.removeEventListener('message', onmessage);
        console.log('DEAD');
        ucode = URL.createObjectURL(code);
        localStorage.setItem('_sharedWorkerBusURL', ucode);
        createWorker(cb);
    }, 50);
    worker.port.start();
    
    function onmessage (msg) {
console.log('MSG=', msg); 
        worker.port.removeEventListener('message', onmessage);
        localStorage.setItem('_sharedWorkerBusURL', ucode);
        clearTimeout(to);
        cb(worker);
    }
}

createWorker(function (w) {
    var id = Math.floor(Math.pow(16,8) * Math.random()).toString(16);
    setInterval(function () {
        w.port.postMessage('id=' + id);
    }, 1000);
    
    w.port.addEventListener('message', function (ev) {
        console.log('M', ev.data);
    });
});

function worksrc () {
    var ports = [];
    self.addEventListener('connect', function (e) {
        var port = e.ports[0];
        ports.push(port);
        
        port.postMessage('_sharedWorkerBusHello');
        port.addEventListener('message', function (e) {
            ports.forEach(function (p, ix) {
                p.postMessage('yo: ' + e.data);
            });
        }, false);
        port.start();
    }, false);
}

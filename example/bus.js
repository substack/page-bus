var worker = new SharedWorker('shared.js');

worker.port.addEventListener('message', function (ev) {
    console.log('MESSAGE!', ev.data);
});
worker.port.start();

var id = Math.floor(Math.pow(16,8) * Math.random()).toString(16);
setInterval(function () {
    worker.port.postMessage('id=' + id);
}, 500);

var bus = require('../')();
var pre = document.querySelector('pre');
var form = document.querySelector('form');

bus.on('hello', function (msg) {
    pre.textContent += msg + '\n';
});

form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    bus.emit('hello', form.elements.msg.value);
});

/**
 * @class
 */
const Worker = (function () {
    var worker;
    var prom;
    var resolves = {};

    function decorate(worker) {
        function execute(options, callback) {
            worker.postMessage({ options: options || {}, callback: callback });
        }
        worker.init = function initWorker(canvas) {
            var offscreen = canvas.transferControlToOffscreen();
            worker.postMessage({ canvas: offscreen }, [offscreen]);
        };

        worker.fire = function fireWorker(options, size, done) {
            if (prom) {
                execute(options, null);
                return prom;
            }

            var id = Math.random().toString(36).slice(2);

            prom = promise(function (resolve) {
                function workerDone(msg) {
                    if (msg.data.callback !== id) {
                        return;
                    }

                    delete resolves[id];
                    worker.removeEventListener('message', workerDone);

                    prom = null;
                    done();
                    resolve();
                }

                worker.addEventListener('message', workerDone);
                execute(options, id);

                resolves[id] = workerDone.bind(null, { data: { callback: id } });
            });

            return prom;
        };

        worker.reset = function resetWorker() {
            worker.postMessage({ reset: true });

            for (var id in resolves) {
                resolves[id]();
                delete resolves[id];
            }
        };
    }

    return function () {
        if (worker) {
            return worker;
        }

        if (!isWorker && canUseWorker) {
            var code = [
                'var CONFETTI, SIZE = {}, module = {};',
                '(' + main.toString() + ')(this, module, true, SIZE);',
                'onmessage = function(msg) {',
                '  if (msg.data.options) {',
                '    CONFETTI(msg.data.options).then(function () {',
                '      if (msg.data.callback) {',
                '        postMessage({ callback: msg.data.callback });',
                '      }',
                '    });',
                '  } else if (msg.data.reset) {',
                '    CONFETTI && CONFETTI.reset();',
                '  } else if (msg.data.resize) {',
                '    SIZE.width = msg.data.resize.width;',
                '    SIZE.height = msg.data.resize.height;',
                '  } else if (msg.data.canvas) {',
                '    SIZE.width = msg.data.canvas.width;',
                '    SIZE.height = msg.data.canvas.height;',
                '    CONFETTI = module.exports.create(msg.data.canvas);',
                '  }',
                '}',
            ].join('\n');
            try {
                worker = new Worker(URL.createObjectURL(new Blob([code])));
            } catch (e) {
                // eslint-disable-next-line no-console
                typeof console !== undefined && typeof console.warn === 'function' ? console.warn('🎊 Could not load worker', e) : null;

                return null;
            }

            decorate(worker);
        }

        return worker;
    };
})();

export default woWorker;

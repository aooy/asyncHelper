(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.asyncHelper = factory());
}(this, (function () { 'use strict';

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;

var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

var  hasPromise = (function () {
    var _this;
    if (typeof global !== 'undefined') {
        _this = global;
    } else if (typeof self !== 'undefined') {
        _this = self;
    } else {
        throw new Error ('global object is unavailable in this environment');
    }
    var promiseToString = undefined;
    if(_this.Promise) {
        try {
            promiseToString = Object.prototype.toString.call(_this.Promise.resolve());
        } catch (e) {

        }
    }
    return promiseToString === '[object Promise]';
})();


var hasMicrotask = isNode || hasPromise || BrowserMutationObserver ? true : false;

function toArray (likeArr) {
    return Array.prototype.slice.call(likeArr);
}

function usePromise(fn) {
  return function () {
    return Promise.resolve().then(fn);
  };
}

function useNextTick(fn) {
  return function () {
    return process.nextTick(fn);
  };
}

function useMutationObserver(fn) {
  var iterations = 0;
  var observer = new BrowserMutationObserver(fn);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

function useMessageChannel(fn) {
  var channel = new MessageChannel();
  channel.port1.onmessage = fn;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout(fn) {
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(fn, 1);
  };
}

var scheduleFlush = undefined, taskMethod = undefined, mtaskMethod = undefined;

if(hasMicrotask) {
    if (isNode) {
      mtaskMethod = useNextTick;
      scheduleFlush = useNextTick(flush);
    } else if (hasPromise) {
      mtaskMethod = usePromise; 
      scheduleFlush = usePromise(flush);  
    } else if (BrowserMutationObserver) {
      mtaskMethod = useMutationObserver;  
      scheduleFlush = useMutationObserver(flush);  
    }
} 

if (isWorker) {
    taskMethod = useMessageChannel;
    scheduleFlush = useMessageChannel(flush);
} else {
    taskMethod = useSetTimeout;
    scheduleFlush = useSetTimeout(flush);
}

function flush () {
    tasksQueue.length && runTasks(tasksQueue) && (tasksQueue.length = 0);
}

function runTasks (taskQueue) {
    var taskLen = taskQueue.length;

    for(var i = 0; i < taskLen; i++){
        var fnStore = taskQueue[i];
        var option = fnStore.option;
        var fn = fnStore.fn;
        var fnArgs = fnStore.argsQueue;
        var type = fnStore.type;
        var t;
        if( (t = fnStore.option.callMode) !== undefined ){
            if(t === 'first'){
                callByType(type, fn, fnArgs[0], option.context);          
                continue;
            } else if (t === 'last') {
                callByType(type, fn, fnArgs[fnArgs.length - 1], option.context);
                continue;
            }
        }

        for (var j = 0; j < fnArgs.length; j++) {
            callByType(type, fn, fnArgs[j], option.context);     
        }
    }
    return true;
}

function callByType (type, cb, args, context) {
    if(type === 'TASK'){
        taskMethod(function(){return cb.apply(context, args);})();
    } else if (type === 'MTASK'){
        cb.apply(context, args);
    }
}

var tasksQueue = [];

function mid (fn, type, option) {
   var newfn = {
         fn: fn,
         type: type,
         option: option || {},
         argsQueue: []
   };

   tasksQueue.push(newfn)

   return function () {
       newfn.argsQueue.push(toArray(arguments));
       scheduleFlush();
   };
}

function task (fn, option) {
    return mid(fn, 'TASK', option);
}

function mtask (fn, option) {
    return  mid(fn, 'MTASK', option);
}

function asyncHelper () {
   this.task = task;
   this.mtask = mtask;
}

return new asyncHelper();

})));
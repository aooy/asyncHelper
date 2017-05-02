# asyncHelper

asyncHelper提供简单的异步插入task和microtask。

# 引入

文件位于dist/asyncHelper.js,支持常用的模块标准。
```js
//例如：
//CommonJS
var asyncHelper = require('./dist/asyncHelper.js');
//Browser globals
<script src="path/to/asyncHelper.js"></script>
```

# task

asyncHelper.task(fn, option)

例子：
```js
//生成一个task
var myTask = asyncHelper.task(function(name){
   console.log(name)
})

//异步插入一个task
myTask('task')

```
# microtask

asyncHelper.mtask(fn, option)

例子：
```js
//生成一个task
var myMicrotaskTask = asyncHelper.mtask(function(name){
   console.log(name)
})

//异步插入一个microtask
myMicrotaskTask('this is microtask')

```

## Note
当没有提供microtask的api时，会回退成task。

# option

asyncHelper.task和asyncHelper.mtask的第二个参数接受一个配置对象。

option的可选参数如下：

参数     |   类型  |     默认    |                        描述
------- | ------- | ---------- | -------------------------------------------------
callMode  | String | undefined | first: 在一轮event loop中只有第一次调用会执行。 last: 在一轮event loop中只有最后一次调用会执行。
context | Object | 全局对象/undefined | 调用函数的对象，如果不指定将会是全局对象或者undefined(严格模式)


例子：
```js

//生成一个task
var option = {callMode: 'last'}
var myMicrotaskTask = asyncHelper.mtask(function(say){
   console.log(say)
}, option)

//不会执行
myMicrotaskTask('this is microtask')
myMicrotaskTask('this is microtask')
myMicrotaskTask('this is microtask')
//执行
myMicrotaskTask('last')

```




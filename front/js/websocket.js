/**
 * websocket套接字
 * Created by tianrenjie on2018/6/15
 */

class Socket{
  constructor(url, options) {
    try {
      this.DEFAULTS = {
        ERROR: -1, // -1 错误
        CONNECTING: WebSocket.CONNECTING, // 0, 连接正在进行，但还没有建立
        OPEN: WebSocket.OPEN, // 1, 连接已经建立，可以发送消息
        ClOSING: WebSocket.CLOSING, // 2, 连接正在进行关闭握手
        CLOSED: WebSocket.CLOSED, // 3, 连接已经关闭或不能打开
      };
      this.lock = false;
      this.url = url;
      this.options = options;
      if (typeof options === 'undefined') {
        this.socket = new WebSocket(url);
      } else {
        this.socket = new WebSocket(url, options);
      }
    } catch (err) {
      console.log('套接字初始化错误,', err.code, err.message);
      this.reconnect();
    }
  }
  init(bindOpenCallBack, bindMessageCallBack, bindCloseCallBack, bindErrorCallBack) {
    this.bindOpenCallBack = bindOpenCallBack;
    this.bindMessageCallBack = bindMessageCallBack;
    this.bindCloseCallBack = bindCloseCallBack;
    this.bindErrorCallBack = bindErrorCallBack;
    bindOpenCallBack && this.bindOpen(bindOpenCallBack);
    bindMessageCallBack && this.bindMessage(bindMessageCallBack);
    bindCloseCallBack && this.bindClose(bindCloseCallBack);
    bindErrorCallBack && this.bindError(bindErrorCallBack);
  }
  checkConnection() {
    if(this.heartCheck) {
      return this.heartCheck;
    }
    const heartCheck = Object.create(null);
    const _this = this;
    Object.defineProperties(heartCheck, {
      timeout: {
        value: 60000,
        configurable: false,
        enumerable: false,
        writable: false,
      },
      timeoutObj: {
        value: null,
        configurable: true,
        enumerable: false,
        writable: true,
      },
      serverTimeoutObj: {
        value: null,
        configurable: true,
        enumerable: false,
        writable: true,
      }
    });
    heartCheck.start = function () {
      heartCheck.timeoutObj = setTimeout(function(){
        _this.send("HeartBeat...");
        console.log("HeartBeat...");
        heartCheck.serverTimeoutObj = setTimeout(function(){
          // _this.reconnect();
          console.log('server close');
          _this.close();//如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
        }, heartCheck.timeout);
      }, heartCheck.timeout);
    };
    heartCheck.reset= function () {
      clearTimeout(heartCheck.timeoutObj);
      clearTimeout(heartCheck.serverTimeoutObj);
      return heartCheck;
    };
    this.heartCheck = heartCheck;
    return this.heartCheck;
  }
  reconnect() {
    const _this = this;
    if(this.lock) {
      return;
    }
    this.lock = true;
    //没连接上会一直重连，设置延迟避免请求过多
    setTimeout(function () {
      try {
        _this.DEFAULTS = {
          ERROR: -1, // -1 错误
          CONNECTING: WebSocket.CONNECTING, // 0, 连接正在进行，但还没有建立
          OPEN: WebSocket.OPEN, // 1, 连接已经建立，可以发送消息
          ClOSING: WebSocket.CLOSING, // 2, 连接正在进行关闭握手
          CLOSED: WebSocket.CLOSED, // 3, 连接已经关闭或不能打开
        };
        if (typeof options === 'undefined') {
          _this.socket = new WebSocket(_this.url);
        } else {
          _this.socket = new WebSocket(_this.url, _this.options);
        }
        _this.lock = false;
      } catch (err) {
        console.log('套接字初始化错误,', err.code, err.message);
      }
      _this.init(_this.bindOpenCallBack, _this.bindMessageCallBack, _this.bindCloseCallBack, _this.bindErrorCallBack);
    }, 2000);
  }
  bindOpen(bindOpenCallBack) {
    const _this = this;
    try{
      this.socket.onopen = function(event) {
        _this.checkConnection().reset().start();
        bindOpenCallBack(event);
      };
    } catch(err) {
      console.log('套接字连接错误,', err.code, err.message);
    }
  }
  bindMessage(bindMessageCallBack) {
    const _this = this;
    try{
      this.socket.onmessage = function (event) {
        _this.checkConnection().reset().start();
        bindMessageCallBack(event);
      };
    } catch(err) {
      console.log('套接字通信错误,', err.code, err.message);
    }
  }
  bindClose(bindCloseCallBack) {
    const _this = this;
    try{
      this.socket.onclose = function(event) {
        _this.reconnect();
        bindCloseCallBack(event);
      };
    } catch(err) {
      console.log('套接字断开错误,', err.code, err.message);
    }
  }
  bindError(bindErrorCallBack) {
    const _this = this;
    this.socket.onerror = function (event) {
      _this.reconnect();
      bindErrorCallBack(event);
    };
  }
  send(msg) {
    const  _this = this;
    return new Promise(function (resolve, reject) {
      try{
        _this.socket.send(msg);
        resolve();
      } catch(err) {
        console.log('套接字通信错误,', err.code, err.message);
        reject(err);
      }
    });
  }
  close() {
    const  _this = this;
    return new Promise(function (resolve, reject) {
      try{
        _this.socket.close();
        resolve();
      } catch(err) {
        console.log('套接字断开错误,', err.code, err.message);
        reject(err);
      }
    });
  }
  getState() {
    try{
      switch (this.socket.readyState) {
        case this.DEFAULTS.CONNECTING:
          return { code: this.DEFAULTS.CONNECTING, msg: '连接正在进行，但还没有建立' };
        case this.DEFAULTS.OPEN:
          return { code: this.DEFAULTS.OPEN, msg: '连接已经建立，可以发送消息' };
        case this.DEFAULTS.ClOSING:
          return { code: this.DEFAULTS.ClOSING, msg: '连接正在进行关闭握手' };
        case this.DEFAULTS.CLOSED:
          return { code: this.DEFAULTS.CLOSED, msg: '连接已经关闭或不能打开' };
        default:
          return { code: this.DEFAULTS.ERROR, msg: '连接错误' };
      }
    } catch(err) {
      console.log('套接字状态获取错误,', err.code, err.message);
    }
  }
}

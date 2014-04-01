var util = require('util');
var stream = require('stream');

var SEND_INTERVAL = 500;
var CHECK_INTERVAL = 50;

function sendLoop(ssp){

  var delta = Date.now() - ssp.lastCheck;
  ssp.lastCheck = Date.now();
  ssp.lastSend += delta;
  if(ssp.lastSend > SEND_INTERVAL && ssp.buffer){
    ssp.lastSend = 0;
    var base64Str = ssp.buffer.toString('base64');
    console.log('sending data', base64Str);
    ssp.skynet.send(base64Str);
    ssp.buffer = null;
  }

  setTimeout(function(){
    sendLoop(ssp);
  }, CHECK_INTERVAL);
}

function SkynetSerialPort(skynetConnection, sendUuid) {
  this.skynet = skynetConnection;
  this.sendUuid = sendUuid;
  this.buffer = null;
  this.lastCheck = 0;
  this.lastSend = 0;


  var self = this;
  this.skynet.on('message', function(message){
    console.log('message from skynet', message);
    if(typeof message == 'string'){
      self.emit("data", new Buffer(message, 'base64'));
    }

  });

  console.log('sending bind request to', sendUuid);
  this.skynet.bindSocket({uuid: sendUuid}, function(data){
    if((data && data.result == 'ok') || (data == 'ok')){
      console.log('bind successful');
      sendLoop(self);
    }else{
      console.log('error binding', result);
      throw new Error('failed to bind socket:' + result);
    }
  });
}

util.inherits(SkynetSerialPort, stream.Stream);


SkynetSerialPort.prototype.open = function (callback) {
  this.emit('open');
  if (callback) {
    callback();
  }

};



SkynetSerialPort.prototype.write = function (data, callback) {

  var self = this;
  if (!this.skynet || !this.sendUuid) {
    var err = new Error("SkynetSerialport not open.");
    if (callback) {
      callback(err);
    } else {
      self.emit('error', err);
    }
    return;
  }

  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data);
  }

  if(this.buffer){
    this.buffer = Buffer.concat([this.buffer, data]);
  }else{
    this.buffer = data;
  }

  console.log('adding data to buffer:', data);
};



SkynetSerialPort.prototype.close = function (callback) {
  console.log('closing');
  if(callback){
    callback();
  }
};

SkynetSerialPort.prototype.flush = function (callback) {
  console.log('flush');
  if(callback){
    callback();
  }
};

SkynetSerialPort.prototype.drain = function (callback) {
  console.log('drain');
  if(callback){
    callback();
  }
};


function bindPhysical(serialPort, skynet, sendUuid){
  var lastCheck = Date.now();
  var lastSend = 0;
  var buffer;

  function send(){
    var delta = Date.now() - lastCheck;
    lastCheck = Date.now();
    lastSend += delta;
    if(lastSend > SEND_INTERVAL && buffer){
      lastSend = 0;
      var base64Str = buffer.toString('base64');
      console.log('sending data', base64Str);
      skynet.send(base64Str);
      buffer = null;
    }

    setTimeout(send, CHECK_INTERVAL);
  }

  serialPort.on('data', function(data){
    //console.log('serialport data received', data);
    if(buffer){
      buffer = Buffer.concat([buffer, data]);
    }else{
      buffer = data;
    }
  });

  skynet.on('bindSocket', function(data, fn){
    console.log('bindSocket', data, fn);
    //could possibly do some checking on data
    if(fn){
      fn('ok');
    }
  });

  skynet.on('message', function(message){
    console.log('message from skynet', message);
    if(typeof message == 'string'){
      try{
        serialPort.write(new Buffer(message, 'base64'));
      }catch(exp){
        console.log('error reading message', exp);
      }

    }

  });

  send();

}


module.exports = {
  SerialPort: SkynetSerialPort,
  bindPhysical: bindPhysical
};

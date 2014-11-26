'use strict';

var util = require('util');
var stream = require('stream');
var _ = require('lodash');

var SEND_INTERVAL = 500;
var CHECK_INTERVAL = 50;


function sendLoop(ssp){
  ssp.running = true;

  var delta = Date.now() - ssp.lastCheck;
  ssp.lastCheck = Date.now();
  ssp.lastSend += delta;
  //console.log('checking', ssp.lastSend, ssp.sendInterval, ssp.buffer);
  if(ssp.lastSend > ssp.sendInterval && ssp.buffer){
    ssp.lastSend = 0;
    var binaryStr = ssp.buffer.toString('base64');
    var msg = {
      payload: binaryStr
    };
    if(ssp.subdevice){
      msg.subdevice = ssp.subdevice;
    }
    if(ssp.sendUuid){
      msg.devices = ssp.sendUuid;
      ssp.skynet.directText(msg);
      console.log('sent data', msg);
    }else{
      ssp.skynet.textBroadcast(binaryStr);
    }
    ssp.buffer = null;
  }

  setTimeout(function(){
    sendLoop(ssp);
  }, ssp.checkInterval);
}

function SkynetSerialPort(skynetConnection, options) {
  if(typeof options === 'string'){
    this.sendUuid = [options];
    this.checkInterval = CHECK_INTERVAL;
    this.sendInterval = SEND_INTERVAL;
  }else if (typeof options === 'object'){
    this.sendUuid = options.sendUuid;
    if(this.sendUuid && typeof this.sendUuid === 'string'){
      this.sendUuid = [this.sendUuid];
    }
    this.subdevice = options.subdevice;
    this.checkInterval = options.checkInterval || CHECK_INTERVAL;
    this.sendInterval = options.sendInterval || SEND_INTERVAL;
  }else if(Array.isArray(options)){
    this.sendUuid = options;
    this.checkInterval = CHECK_INTERVAL;
    this.sendInterval = SEND_INTERVAL;
  }

  this.skynet = skynetConnection;
  this.buffer = null;
  this.lastCheck = 0;
  this.lastSend = 0;

  var self = this;
  //console.log('conn', skynetConnection);
  skynetConnection.on('tb', function(message){

    console.log('message from skynet', message);

    if(typeof message === 'string'){
      self.emit('data', new Buffer(message, 'base64'));
    }
    else if(typeof message === 'object' && _.contains(self.sendUuid, message.fromUuid) && typeof message.payload === 'string'){
      self.emit('data', new Buffer(message.payload, 'base64'));
    }
    else{
      console.log('invalid text broadcast', message);
    }

  });

  if(this.sendUuid){
    self.sendUuid.forEach(function(uuid){
      self.skynet.subscribeText(uuid, function(result){
        console.log('subcribe', uuid, result);
      });
    });
  }


  //TODO - MAJOR: kick off soon as subscribtions are done.
  setTimeout(function(){
    sendLoop(self);
  }, 1000);

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
  if (!this.skynet) {
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


function bindPhysical(serialPort, skynet){
  var lastCheck = Date.now();
  var lastSend = 0;
  var buffer;

  function serialWrite(data){
    try{
      if(typeof data === 'string'){
        data = new Buffer(data, 'base64');
      }
      serialPort.write(data);
    }catch(exp){
      console.log('error reading message', exp);
    }
  }

  function send(){
    var delta = Date.now() - lastCheck;
    lastCheck = Date.now();
    lastSend += delta;
    if(lastSend > SEND_INTERVAL && buffer){
      lastSend = 0;
      var binaryStr = buffer.toString('base64');
      console.log('sending data', binaryStr);
      skynet.textBroadcast(binaryStr);
      buffer = null;
    }

    setTimeout(send, CHECK_INTERVAL);
  }

  serialPort.on('data', function(data){
    if(buffer){
      buffer = Buffer.concat([buffer, data]);
    }else{
      buffer = data;
    }
  });

  skynet.on('tb', function(message){
    console.log('message from skynet', message);
    if(typeof message === 'string'){
      serialWrite(message);
    }else if (typeof message === 'object'){
      serialWrite(message.payload);
    }

  });

  send();

}


module.exports = {
  SerialPort: SkynetSerialPort,
  bindPhysical: bindPhysical
};

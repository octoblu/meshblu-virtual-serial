'use strict';

var util = require('util');
var stream = require('stream');
var debug = require('debug')('meshblu-virtual-serial');

var SEND_INTERVAL = 500;
var CHECK_INTERVAL = 50;


function sendLoop(ssp){
  ssp.running = true;
  var destinationUuid = ssp.sendUuid || '*';

  var delta = Date.now() - ssp.lastCheck;
  ssp.lastCheck = Date.now();
  ssp.lastSend += delta;
  if(ssp.lastSend > ssp.sendInterval && ssp.buffer){
    ssp.lastSend = 0;
    var binaryStr = ssp.buffer.toString('base64');

    debug('meshblu out', destinationUuid, binaryStr);
    ssp.skynet.message(destinationUuid, binaryStr);
    ssp.buffer = null;
  }

  setTimeout(function(){
    sendLoop(ssp);
  }, ssp.checkInterval);
}

function MeshbluSerialPort(skynetConnection, options) {
  this.checkInterval = CHECK_INTERVAL;
  this.sendInterval = SEND_INTERVAL;

  if(typeof options === 'string'){
    this.sendUuid = [options];
  }else if(Array.isArray(options)){
    this.sendUuid = options;
  }else if (typeof options === 'object'){
    this.sendUuid = options.sendUuid;
    if(this.sendUuid && typeof this.sendUuid === 'string'){
      this.sendUuid = [this.sendUuid];
    }
    this.subdevice = options.subdevice;
    this.checkInterval = options.checkInterval || this.checkInterval;
    this.sendInterval = options.sendInterval || this.sendInterval;
  }

  this.skynet = skynetConnection;
  this.buffer = null;
  this.lastCheck = 0;
  this.lastSend = 0;

  var self = this;
  skynetConnection.on('message', function(message){
    debug('meshblu in', message);
    if(typeof message === 'string'){
      self.emit('data', new Buffer(message, 'base64'));
    }
    else if(typeof message === 'object' && typeof message.payload === 'string'){
      self.emit('data', new Buffer(message.payload, 'base64'));
    }
    else{
      console.error('invalid text broadcast', message);
    }

  });

  if(this.sendUuid){
    self.sendUuid.forEach(function(uuid){
      debug('subscribing to', uuid);
      self.skynet.subscribe({uuid: uuid, types: ['broadcast']}, function(ok){
        debug('subscribed to', uuid, ok);
      });
    });
  }


  //TODO - MAJOR: kick off soon as subscribtions are done.
  setTimeout(function(){
    sendLoop(self);
  }, 1000);

}

util.inherits(MeshbluSerialPort, stream.Stream);


MeshbluSerialPort.prototype.open = function (callback) {
  this.emit('open');
  if (callback) {
    callback();
  }
};

MeshbluSerialPort.prototype.write = function (data, callback) {
  var self = this;
  if (!this.skynet) {
    var err = new Error("MeshbluSerialPort not open.");
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
};



MeshbluSerialPort.prototype.close = function (callback) {
  if(callback){
    callback();
  }
};

MeshbluSerialPort.prototype.flush = function (callback) {
  if(callback){
    callback();
  }
};

MeshbluSerialPort.prototype.drain = function (callback) {
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
      console.error('error reading message', exp);
    }
  }

  function send(){
    var delta = Date.now() - lastCheck;
    lastCheck = Date.now();
    lastSend += delta;
    if(lastSend > SEND_INTERVAL && buffer){
      lastSend = 0;
      var binaryStr = buffer.toString('base64');
      debug('meshblu out', buffer, binaryStr);
      skynet.message('*', binaryStr);
      buffer = null;
    }

    setTimeout(send, CHECK_INTERVAL);
  }

  serialPort.on('data', function(data){
    debug('serialport data', data);
    if(buffer){
      buffer = Buffer.concat([buffer, data]);
    }else{
      buffer = data;
    }
  });

  skynet.on('message', function(message){
    debug('on skynet message', message, typeof message);
    if(typeof message === 'string'){
      serialWrite(message);
    }else if (typeof message === 'object'){
      serialWrite(message.payload);
    }

  });

  send();

}


module.exports = {
  SerialPort: MeshbluSerialPort,
  bindPhysical: bindPhysical
};

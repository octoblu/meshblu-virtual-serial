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
    var sendMessage = {
      devices: ssp.sendUuid,
      message: {
        data: ssp.buffer.toString('base64')
      }
    };
    console.log('sending data', sendMessage);
    ssp.skynet.message(sendMessage);
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
  this.skynet.on('message', function(toUuid, message){
    console.log('message from skynet', toUuid, message);
    if(typeof message == 'string'){
      try{
        message = JSON.parse(message);
        if(message.data){
          self.emit("data", new Buffer(message.data, 'base64'));
        }
      }catch(exp){
        console.log('Not json', message);
      }
    }
  });
  sendLoop(this);
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
      var sendMessage = {
        devices: sendUuid,
        message: {
          data: buffer.toString('base64')
        }
      };
      console.log('sending data', sendMessage);
      skynet.message(sendMessage);
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

  skynet.on('message', function(toUuid, message){
    console.log('message from skynet', toUuid, message);
    if(typeof message == 'string'){
      try{
        message = JSON.parse(message);
        if(message && message.data){
          //console.log('writing to serial port', message.message.data);
          serialPort.write(new Buffer(message.data, 'base64'));
        }
      }catch(exp){
        console.log('error parsing json', exp);
      }

    }

  });

  send();

}


module.exports = {
  SerialPort: SkynetSerialPort,
  bindPhysical: bindPhysical
};

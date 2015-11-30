meshblu-virtual-serial
======================

Virtual serial port running on top of meshblu (formerly skynet.im)

#Use with Remote-IO!

https://github.com/monteslu/remote-io


# MeshbluSerialPort

Use skynet to message a physical remote serial device:

```js
var MeshbluSerialPort = require('skynet-serial').SerialPort;
var meshblu = require('meshblu');

// setup variables for myId, token, sendId
// the sendId is for the uuid of the physical serial device

var conn = meshblu.createConnection({
  uuid: myId,
  token: token
});

conn.on('ready', function(data){
  var serialPort = new MeshbluSerialPort(conn, sendId);
  var board = new firmata.Board(serialPort, function (err, ok) {
    if (err){ throw err; }
    //light up a pin
    board.digitalWrite(13, 1);
  });
});

```


# bindPhysical

Bind a physical serial port to recieve/push data from skynet:

```js
var SerialPort = require('serialport').SerialPort;
var bindPhysical = require('skynet-serial').bindPhysical;
var meshblu = require('meshblu');

// setup variables for myId, token, sendId
// the sendId should be for the uuid of the MeshbluSerialPort app.

var conn = meshblu.createConnection({
  uuid: myId,
  token: token
});

conn.on('ready', function(data){
  var serialPort = new SerialPort('/dev/tty.usbmodem1411',{
      baudrate: 57600,
      buffersize: 1
  });
  bindPhysical(serialPort, conn);
});

```

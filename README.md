skynet-serial
=============

Virtual serial port running on top of skynet.im



# SkynetSerialPort

Use skynet to message a physical remote serial device:

```js
var SkynetSerialPort = require('skynet-serial').SerialPort;
var skynet = require('skynet');

... //setup variables for myId, token, and sendId

var conn = skynet.createConnection({
  uuid: myId,
  token: token
});

conn.on('ready', function(data){
  serialPort = new SkynetSerialPort(conn, sendId);
  board = new firmata.Board(serialPort, function (err, ok) {
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

... //setup variables for myId, token, and sendId

var conn = skynet.createConnection({
  uuid: myId,
  token: token
});

conn.on('ready', function(data){
  serialPort = new SerialPort('/dev/tty.usbmodem1411',{
      baudrate: 57600,
      buffersize: 1
  });
  bindPhysical(serialPort, conn, sendId);
});

```

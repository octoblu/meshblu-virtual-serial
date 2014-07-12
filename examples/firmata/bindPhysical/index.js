var SerialPort = require('serialport').SerialPort;
var bindPhysical = require('skynet-serial').bindPhysical;
var skynet = require('skynet-mqtt');

// You mus set up variables for myId and token
// You can create a skynet device with this curl command:
// curl -X POST -d "type=fakeFirmware&payloadOnly=true&name=myDevice" http://skynet.im/devices

var myId = 'REPLACE THIS WITH A UUID !!!';
var token = 'REPLACE THIS WITH A TOKEN!!!!';

var conn = skynet.createConnection({
  uuid: myId,
  token: token
});

//This will likely be dependent on which port your using and which OS
//On windows this may be something like COM1 or COM2, etc.
var portName = '/dev/tty.usbmodem1411';

conn.on('ready', function(data){
  var serialPort = new SerialPort(portName,{
      baudrate: 57600,
      buffersize: 1
  });
  bindPhysical(serialPort, conn);
});

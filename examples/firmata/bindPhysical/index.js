var SerialPort = require('serialport').SerialPort;
var bindPhysical = require('../../../').bindPhysical;
var meshblu = require('meshblu');

// You mus set up variables for myId and token
// You can create a meshblu device with this curl command:
// curl -X POST -H "Content-Type: application/json" -d '{"type":"thing","name":"myDevice","receiveWhitelist":["*"],"sendWhitelist":["*"]}' http://meshblu.octoblu.com/devices

var myId = process.env.UUID || 'REPLACE THIS WITH A UUID !!!';
var token = process.env.TOKEN || 'REPLACE THIS WITH A TOKEN!!!!';

var conn = meshblu.createConnection({
  uuid: myId,
  token: token
});

//This will likely be dependent on which port your using and which OS
//On windows this may be something like COM1 or COM2, etc.
var portName = '/dev/tty.usbmodem1411';

conn.on('ready', function(data){
  console.log('meshblu connection ready, connecting to serial port');
  var serialPort = new SerialPort(portName,{
      baudrate: 57600,
      buffersize: 1
  });
  bindPhysical(serialPort, conn);
});

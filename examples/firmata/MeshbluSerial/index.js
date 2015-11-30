var MeshbluSerialPort = require('../../../').SerialPort;
var meshblu = require('meshblu');
var firmata = require('firmata');

// You mus set up variables for myId and token
// You can create a meshblu device with this curl command:
// curl -X POST -H "Content-Type: application/json" -d '{"type":"thing","name":"myDevicereceive","receiveWhitelist":["*"],"sendWhitelist":["*"]}' http://meshblu.octoblu.com/devices

var myId = process.env.UUID || 'REPLACE THIS WITH A UUID !';
var token = process.env.TOKEN || 'REPLACE THIS WITH A TOKEN !';

// the sendId is for the uuid of the physical serial device
var sendId = process.env.SEND_ID || 'REPLACE THIS WITH YOUR TARGET DEVICE UUID!';
var board;
var pinState = 1;

var conn = meshblu.createConnection({
  uuid: myId,
  token: token
});

conn.on('ready', function(data){
  console.log('client ready, creating virtual serial port');
  var serialPort = new MeshbluSerialPort(conn, sendId);
  var options = {skipHandshake:true};
  board = new firmata.Board(serialPort, options, function (err, ok) {
    console.log('firmata ready');
    if (err){ throw err; }

    togglePin();

  });
});

function togglePin(){
  console.log('toggling', pinState);
  if(pinState){
    pinState = 0;
  }else{
    pinState = 1;
  }
  board.digitalWrite(13, pinState);
  setTimeout(togglePin, 750);
}

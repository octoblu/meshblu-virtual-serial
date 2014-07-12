var SkynetSerialPort = require('skynet-serial').SerialPort;
var skynet = require('skynet');
var firmata = require('firmata');

// You mus set up variables for myId and token
// You can create a skynet device with this curl command:
// curl -X POST -d "type=fakeFirmware&payloadOnly=true&name=myDevice" http://skynet.im/devices

var myId = 'REPLACE THIS WITH A UUID !';
var token = 'REPLACE THIS WITH A TOKEN !';

// the sendId is for the uuid of the physical serial device
var sendId = 'REPLACE THIS WITH YOUR TARGET DEVICE UUID!';
var board;
var pinState = 1;

var conn = skynet.createConnection({
  uuid: myId,
  token: token
});

conn.on('ready', function(data){
  var serialPort = new SkynetSerialPort(conn, sendId);
  board = new firmata.Board(serialPort, {samplingInterval:60000}, function (err, ok) {
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

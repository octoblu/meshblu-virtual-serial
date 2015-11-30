# Firmata Arduino bindPhysical example

This example lets you connect an Arduino to meshblu with a serial cable.

*  Grab an Arduino (UNOs are cool), and using the Arduino IDE, put the Standare Firmata sketch on it.
*  Close the Arduino IDE, you're done with it.
*  Run `npm install` in this directory.
*  Create a device record on skynet for your Arduino:  `curl -X POST -H "Content-Type: application/json" -d '{"type":"thing","name":"myDevice","receiveWhitelist":["*"],"sendWhitelist":["*"]}' http://meshblu.octoblu.com/devices`
*  Edit the index.js file in this directory with the `uuid` and `token` you got a response from with that curl command.
*  Run 'node index' in this directory.
*  Send data to the device from anywhere on the Internet using the SkynetSerial example up one directory from here.

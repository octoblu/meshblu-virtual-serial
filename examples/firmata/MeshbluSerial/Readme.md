# MeshbluSerial Firmata example

This example lets you remote control an Arduino with Microblu (SkynetOS), or connected to mesbhlu with the bindPhysical example application.

*  Run `npm install` in this directory.
*  Create a device record on skynet for your Arduino:  `curl -X POST -H "Content-Type: application/json" -d '{"type":"thing","name":"myDevicereceive","receiveWhitelist":["*"],"sendWhitelist":["*"]}' http://meshblu.octoblu.com/devices`
*  Edit the index.js file in this directory with the `uuid` and `token` you got a response from with that curl command.
*  Run 'node index' in this directory.
*  Sit back and watch pin 13 toggle on and off.

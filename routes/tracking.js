/*
    Route ist zum Anzeigen der gelaufenen Route da
    Die gelaufene Route soll aus der MongoDB gezogen werden und auf Google Maps angezeigt werden.
    Idee: Für jede gelaufene Route gibt es eine eindeutige ID!!
*/

const express = require('express');
const router = express.Router();

//MQTT Module
const myMqtt = require("./mqttClient");

function loadRoute(res, bufferArray){
    res.render('tracking', {
        gpsData: bufferArray
    });
}

//Route/Run
router.get('/', (req, res) => {
    var bufferArray = myMqtt.getBufferArray();
    loadRoute(res, bufferArray);
});

module.exports = router;

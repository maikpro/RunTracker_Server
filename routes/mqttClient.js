const express = require('express');
const router = express.Router();

//MongoDB Module
const myMongoDB = require("../database/mongodb");

//MQTT Broker Module
const mqtt = require('mqtt');
const mqttClient = mqtt.connect('mqtt://broker.mqttdashboard.com');

//MQTT Topic
const gpsTopic = "m5stackGps";

var buffer=[];
var bufferArray = [];

//lade Daten aus der Datenbank in den arrayBuffer!
function initBufferArray(){
    var promise = myMongoDB.loadGPSData();
    promise.then( (data) => {
        if(data == null){
            console.log("bufferArray ist leer... Keine GPS-Daten vorhanden!");
        } else{
            bufferArray = data.bufferArray;
        }
    });
}

//MQTT Testing
function connectToMQTTBroker(){
    mqttClient.on('connect', () =>{
        mqttClient.subscribe(gpsTopic, (err) =>{
            if(!err){
                console.log("[Node.JS:] connected to HIVEMQ MQTT BROKER");
            }
        });
    });
}

function getMQTTMessage(){
    mqttClient.on('message', (topic, message) => {
        var jsonFromM5 = JSON.parse(message.toString());
        
        if( jsonFromM5.status === 999 ){
            //Status wird NICHT abgespeichert!
            console.log("Nutzer hat die Runde beendet.");
            buffer.push(jsonFromM5);
            bufferArray.push(buffer);

            //speicher das bufferArray in die MongoDB!
            var gpsData = { bufferArray };
            myMongoDB.saveGPSData(gpsData);

            //Hier muss der buffer resettet werden mit den Daten!
            //Für die nächste Runde sollen vorherige Daten nicht enthalten sein!
            //https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
            buffer = [];
        } else{
            buffer.push(jsonFromM5);
        }
    });
}

function getBufferArray(){
    return bufferArray;
}

function clearBufferArray(){
    while(bufferArray.length > 0) {
        bufferArray.pop();
    }
}

//später Daten aus DB laden!
router.get('/gps', (req, res) => {
    var message = getBufferArray();
    res.send(message);
});

//Beispiel GeoJSON
//Coordinates auslesen aus der Datei
router.get('/gps/geojson/test', (req, res) => {
    const geoJSON = {
        "type": "FeatureCollection",
        "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "MultiLineString",
              "coordinates": [
                [
                  //[LONGITUDE, LATITUDE]
                  [8.0250681, 52.2825433],
                  [8.02525, 52.28251],
                  [8.02545, 52.28249],
                  [8.0254463, 52.282487],
                  [8.02543, 52.28241],
                  [8.02541, 52.28234],
                  [8.02538, 52.2823],
                  [8.02524, 52.28208],
                  [8.02519, 52.282],
                  [8.02508, 52.28184]
                ]
              ]
            }
          }
        ]
      }
    res.send(geoJSON);
});



function parseCoordsFromRound(bufferArray, ausgewaehlteRunde){
    //NUR EINE RUNDE WIRD JEWEILS VOM NUTZER AUSGEWÄHLT ZUM ANZEIGEN DER ROUTE AUF MAPS!!!
    if( ausgewaehlteRunde < bufferArray.length ){
        var coordsArray = []; //alle Koordinaten aus der jeweiligen Runde!
        for(var dataset = 0; dataset < bufferArray[ausgewaehlteRunde].length; dataset++){
            var datapoint = bufferArray[ausgewaehlteRunde][dataset]; //durchlaufe einen Datensatz => { gpsLat, gpsLng, date, time }
            //hol nur die Coords
            
            //var coords = datapoint.gpsLat + ", " + datapoint.gpsLng;
            var coords = [];
            coords.push( datapoint.gpsLng );
            coords.push( datapoint.gpsLat );
            
            coordsArray.push( coords ); 
        }
        
        return coordsArray;
    } else{
        return -99;
    }
}

function coordsToGeoJSON(coordsArray){
    const geoJSON = {
        "type": "FeatureCollection",
        "features": 
        [
            {
                "type": "Feature",
                "properties": {},
                "geometry": 
                {
                    "type": "MultiLineString",
                    "coordinates": 
                    [
                        coordsArray
                    ]
                }
            }
        ]
    }

    return geoJSON;
}

router.get('/gps/geojson/:round', (req, res) => {
    var round = req.params.round; //aus der URL auslesen!
    var bufferArray = getBufferArray();
    var coordsArray = parseCoordsFromRound(bufferArray, round);

    if(coordsArray == -99){
        res.send("Diese Runde gibt es nicht!")
    } else{
        const geoJson = coordsToGeoJSON(coordsArray);
        res.send(
            //52.274255,8.012111
            JSON.parse( JSON.stringify( geoJson ) )
        );
    }
});

module.exports = router;
module.exports.initBufferArray = initBufferArray;
module.exports.connectToMQTTBroker = connectToMQTTBroker;
module.exports.getMQTTMessage = getMQTTMessage;
module.exports.getBufferArray = getBufferArray;
module.exports.clearBufferArray = clearBufferArray;
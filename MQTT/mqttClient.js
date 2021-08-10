//MQTT Broker Module
const mqtt = require('mqtt');
//const mqttClient = mqtt.connect('mqtt://broker.hivemq.com')
const mqttClient = mqtt.connect('mqtt://broker.mqttdashboard.com');

//MQTT Topic
const gpsTopic = "m5stackGps";

var buffer=[];


var bufferArray = [];

//lade Daten aus der Datenbank in den arrayBuffer!
module.exports.initBufferArray = (myMongoDB) => {
    var promise = myMongoDB.loadGPSData();
    promise.then( (data) => {
        bufferArray = data.bufferArray;
    });
}

//MQTT Testing
module.exports.connectToMQTTBroker = () => {
    mqttClient.on('connect', () =>{
        mqttClient.subscribe(gpsTopic, (err) =>{
            if(!err){
                console.log("connected to MQTT BROKER");
            }
        });
    });
}

module.exports.getMQTTMessage = (myMongoDB) => {
    mqttClient.on('message', (topic, message) => {
        var jsonFromM5 = JSON.parse(message.toString());
        
        if( jsonFromM5.status === 999 ){
            //Status wird NICHT abgespeichert!
            console.log("Nutzer hat die Runde beendet.");
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

module.exports.getBufferArray = () => {
    return bufferArray;
}

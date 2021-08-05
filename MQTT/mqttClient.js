//MQTT Broker Module
const mqtt = require('mqtt')
//const mqttClient = mqtt.connect('mqtt://broker.hivemq.com')
const mqttClient = mqtt.connect('mqtt://broker.mqttdashboard.com')

const topic = "maiksMqttTest"
var buffer="";

var counter = 0;
function testingMessages(){
    setInterval(() => {
        mqttClient.publish(topic, "counter: " + counter.toString());
        counter++;
    }, 5000);
}

//MQTT Testing
module.exports.sendMQTTMessage = () => {
    mqttClient.on('connect', () =>{
        mqttClient.subscribe(topic, (err) =>{
            if(!err){
                //mqttClient.publish(topic, "Hello Mqtt! HEHE");
                //testingMessages();
            }
        });
    });
}

module.exports.getMQTTMessage = () => {
    mqttClient.on('message', (topic, message) => {
        console.log(message.toString());
        buffer += message;
    });
}

module.exports.getBuffer = () => {
    return buffer;
}

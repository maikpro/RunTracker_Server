/*https://localtunnel.github.io/www/ => Localtunnel allows you to easily share a web service on your local development machine without messing with DNS and firewall settings.*/

/*
    TODO: Wenn localtunnel verwendet wird:
    1. M5Stack: WeatherController.h restUrl ändern in die URL von localtunnel!
    2. M5Stack aktualisieren
    3. Google Maps API Zugriff auf die jeweilige URL anpassen.

*/

const express = require('express')
const app = express()
const port = 3000

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// set the view engine to ejs
app.set('view engine', 'ejs');

//Routes
const homeRoute = require("./routes/home");
const weatherRoute = require("./routes/weather");
const trackingRoute = require("./routes/tracking");
const timeRoute = require("./routes/time");
const mqttRoute = require("./routes/mqttClient");
const settingsRoute = require("./routes/settings");

app.use('/', homeRoute);
app.use('/weather', weatherRoute);
app.use('/tracking', trackingRoute);
app.use('/time', timeRoute);
app.use('/mqtt', mqttRoute);
app.use('/settings', settingsRoute);


//MongoDB Module
const myMongoDB = require("./database/mongodb");

//MQTT Module
const myMqtt = require("./routes/mqttClient");

myMongoDB.connectToMongoDB(); //async

//MQTT
myMqtt.initBufferArray();
myMqtt.connectToMQTTBroker();
myMqtt.getMQTTMessage();

//IP: 192.168.178.37:3000
app.listen(port, () => {
    console.log(`[NODE.JS:] app listening at http://localhost:${port}`)
});
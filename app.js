const express = require('express')
const app = express()
const port = 3000

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// set the view engine to ejs
app.set('view engine', 'ejs');


//MongoDB Module
const myMongoDB = require("./database/mongodb");

//MQTT Module
const myMqtt = require("./MQTT/mqttClient");

//Weather Module
const weather = require("./weather/weather");

//Route Module
const route = require("./route/route");

//Settings Module
const settings = require("./settings/settings");



myMongoDB.connectToMongoDB(); //async

app.get('/', (req, res) => {
    res.render('home');
})

//IP: 192.168.178.37:3000
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});


//MQTT Testing
myMqtt.sendMQTTMessage();
myMqtt.getMQTTMessage();

app.get('/mqtt', (req, res) => {
    const message = myMqtt.getBuffer();
    res.send(message.toString());
});

//Weather Testing
app.get('/weather', (req, res) => {
    //hole aktuellen Citynamen aus der DB und dann lade das aktuelle Wetter aus der OpenWeatherMap Api
    var cityPromise = myMongoDB.loadSettingsData();
    cityPromise.then((result) =>{
        console.log("cityPromise: " + result.city);
        //jsonPromise => Api-Daten aus OpenWeatherMap!
        var jsonPromise = weather.fetchWeather(res, result.city);
        //Promise Problem:
        //https://dev.to/ramonak/javascript-how-to-access-the-return-value-of-a-promise-object-1bck
        jsonPromise
            .then((jsonData) =>{
                res.render('weather', { 
                    temperatur: jsonData.main.temp,
                    city: result.city 
                });
            });
    });
});

//Weather Api
app.get('/weather/api', (req, res) => {
    //hole aktuellen Citynamen aus der DB und dann lade das aktuelle Wetter aus der OpenWeatherMap Api
    var cityPromise = myMongoDB.loadSettingsData();
    cityPromise.then((result) =>{
        console.log("cityPromise: " + result.city);
        //jsonPromise => Api-Daten aus OpenWeatherMap!
        var jsonPromise = weather.fetchWeather(res, result.city);
        //Promise Problem:
        //https://dev.to/ramonak/javascript-how-to-access-the-return-value-of-a-promise-object-1bck
        jsonPromise
            .then((jsonData) =>{
                res.send(jsonData);
            });
    });
});

//Settings
app.get('/settings', (req, res) => {
    settings.loadSettings(res, myMongoDB);
});

//https://stackoverflow.com/questions/24330014/bodyparser-is-deprecated-express-4
app.post('/settings/save', (req, res) => {
    settings.saveSettings(req, res, myMongoDB);
});


//Route/Run
app.get('/route', (req, res) => {
    route.loadRoute(res);
});


//Coordinates auslesen aus der Datei
app.get('/route/test_route', (req, res) => {
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
                  //[LATITUDE, LONGITUDE]
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


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


//MQTT
myMqtt.initBufferArray(myMongoDB);
myMqtt.connectToMQTTBroker();
myMqtt.getMQTTMessage(myMongoDB);

//später Daten aus DB laden!
app.get('/mqtt/gps', (req, res) => {
    var message = myMqtt.getBufferArray();
    res.send(message);
});

//Weather Testing
app.get('/weather', (req, res) => {
    //hole aktuellen Citynamen aus der DB und dann lade das aktuelle Wetter aus der OpenWeatherMap Api
    var cityPromise = myMongoDB.loadSettingsData();
    cityPromise.then((result) =>{
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

app.post('/settings/deleteGPSData', (req, res) => {
    settings.deleteGPSData(res, myMongoDB);
});


//Route/Run
app.get('/route', (req, res) => {
    var bufferArray = myMqtt.getBufferArray();
    route.loadRoute(res, bufferArray);
});


//Coordinates auslesen aus der Datei
app.get('/mqtt/gps/geojson/test', (req, res) => {
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
    //var ausgewaehlteRunde = 0;
    
    
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

app.get('/mqtt/gps/geojson/:round', (req, res) => {
    var round = req.params.round; //aus der URL auslesen!
    
    var bufferArray = myMqtt.getBufferArray();

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
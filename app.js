/*https://localtunnel.github.io/www/ => Localtunnel allows you to easily share a web service on your local development machine without messing with DNS and firewall settings.*/

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
        var jsonPromise = weather.fetchWeatherHeute(res, result.city);
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
app.get('/weather/api/heute', (req, res) => {
    //hole aktuellen Citynamen aus der DB und dann lade das aktuelle Wetter aus der OpenWeatherMap Api
    var cityPromise = myMongoDB.loadSettingsData();
    cityPromise.then((result) =>{
        //jsonPromise => Api-Daten aus OpenWeatherMap!
        var jsonPromise = weather.fetchWeatherHeute(res, result.city);
        //Promise Problem:
        //https://dev.to/ramonak/javascript-how-to-access-the-return-value-of-a-promise-object-1bck
        jsonPromise
            .then((jsonData) =>{
                res.send(jsonData);
            });
    });
});

/*parst Date und Time aus einem String und generiert ein Array wobei arr[date, time]*/
function parseDateTime(str){
    str = str.split(" ");
    var date=str[0];
    var time=str[1];

    var dateTimeArr = [date, time];
    return dateTimeArr;
}

/*Ändert das Date-Format von yyyy-mm-dd => dd.mm.yyyy*/
function changeDateFormat(date){
    date = date.split("-");
    var year = date[0];
    var month = date[1];
    var day = date[2];
    
    var newDate = day + "." + month + "." + year;
    return newDate;
}

app.get('/weather/api/woche', (req, res) => {
    //hole aktuellen Citynamen aus der DB und dann lade das aktuelle Wetter aus der OpenWeatherMap Api
    var cityPromise = myMongoDB.loadSettingsData();
    cityPromise.then((result) =>{
        //jsonPromise => Api-Daten aus OpenWeatherMap!
        var jsonPromise = weather.fetchWeatherWoche(res, result.city);
        //Promise Problem:
        //https://dev.to/ramonak/javascript-how-to-access-the-return-value-of-a-promise-object-1bck
        jsonPromise
            .then((jsonData) =>{
                //console.log(jsonData.city.name); //=> Stadt
                //=> Morgen
                //console.log(jsonData.list[8].main.temp) //Temperatur
                //console.log(jsonData.list[8].dt_txt) //Datum und Zeit
                //console.log(jsonData.list[8].weather[0].main) //Beschreibung des Wetters (Clouds, Rain, ...)
                //
                var wetterWocheJSON = [];
                //24 Std => 8 Wetterdaten [00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00]
                for(var i = 8; i < jsonData.list.length; i=i+8){
                    
                    var strDateTime = jsonData.list[i].dt_txt.toString();
                    var dateTimeArr = parseDateTime(strDateTime);
                    dateTimeArr[0] = changeDateFormat(dateTimeArr[0]);

                    const JSONObject = { 
                        "temp": jsonData.list[i].main.temp.toString(),
                        "date": dateTimeArr[0],
                        "time": dateTimeArr[1],
                        "description": jsonData.list[i].weather[0].main.toString()
                    };
                    
                    wetterWocheJSON.push( JSONObject );
                    
                    //wetterWocheJSON.push( '{ "temp": "' + jsonData.list[i].main.temp + '", "dateTime": "' + jsonData.list[i].dt_txt + '", "description": "' +  jsonData.list[i].weather[0].main + '" }');
                    
                    if( i + 8 == 40 ){ //maximal werden 40 Wetterdaten geliefert (alle 3 Std für 5 Tage)
                        i--;
                    }
                }

                /*for(var i = 8; i < jsonData.list.length; i=i+8){
                    console.log(jsonData.list[i].main.temp) //Temperatur
                    console.log(jsonData.list[i].dt_txt) //Datum und Zeit
                    console.log(jsonData.list[i].weather[0].main) //Beschreibung des Wetters (Clouds, Rain, ...)
                    console.log("================================================================================");
                    console.log("================================================================================");
                    if( i + 8 == 40 ){ //maximal werden 40 Wetterdaten geliefert (alle 3 Std für 5 Tage)
                        i--;
                    }
                }*/
                
                res.send( JSON.parse( JSON.stringify(wetterWocheJSON)  ) );
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

//Beispiel GeoJSON
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
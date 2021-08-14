const express = require('express');
const router = express.Router();

//MongoDB Module
const myMongoDB = require("../database/mongodb");

//Quelle: https://stackabuse.com/making-http-requests-in-node-js-with-node-fetch
const fetch = require('node-fetch');



/* Umlaute aus dem Stadtnamen ersetzen: Osnabrück => Osnabrueck, München => Muenchen 
    Code Quelle: https://stackoverflow.com/questions/11652681/replacing-umlauts-in-js/11653019
    function replaceUmlaute und umlautMap von Andreas Richter
*/
const umlautMap = {
    '\u00dc': 'UE',
    '\u00c4': 'AE',
    '\u00d6': 'OE',
    '\u00fc': 'ue',
    '\u00e4': 'ae',
    '\u00f6': 'oe',
    '\u00df': 'ss',
  }
  
function replaceUmlaute(str) {
return str
    .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
    const big = umlautMap[a.slice(0, 1)];
    return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
    })
    .replace(new RegExp('['+Object.keys(umlautMap).join('|')+']',"g"),
    (a) => umlautMap[a]
    );
}

async function fetchWeatherHeute(res, dbCity){
    var jsonData;

    var URL = "https://api.openweathermap.org/data/2.5/weather?q=" + replaceUmlaute(dbCity) + "&units=metric&appid=f4bbb65b843c759430db10f6da7ad568";

    await fetch(URL)
        .then(res => res.json())
        .then(json =>{
            jsonData=json;
        })
    return jsonData;
}

async function fetchWeatherWoche(res, dbCity){
    var jsonData;

    //https://api.openweathermap.org/data/2.5/forecast?q=M%C3%BCnchen&units=metric&appid=f4bbb65b843c759430db10f6da7ad568
    var URL = "https://api.openweathermap.org/data/2.5/forecast?q=" + replaceUmlaute(dbCity) + "&units=metric&cnt=41&appid=f4bbb65b843c759430db10f6da7ad568";

    await fetch(URL)
        .then(res => res.json())
        .then(json =>{
            jsonData=json;
        })
    return jsonData;
}

function getDaysOfWeek(){
    const options = { weekday: 'long'};
    var daysOfWeek=[];
 
    for( var i=0; i<5; i++){
        var date = new Date( Date.now() );
        date.setDate(date.getDate()+i);
        var day = date.toLocaleDateString('de-DE', options);
        daysOfWeek.push(day);
    }  
    return daysOfWeek;
}

//Routing Weather
router.get('/', (req, res) => {
    //hole aktuellen Citynamen aus der DB und dann lade das aktuelle Wetter aus der OpenWeatherMap Api
    var cityPromise = myMongoDB.loadSettingsData();
    cityPromise.then((result) =>{
        //Promise Problem:
        //https://dev.to/ramonak/javascript-how-to-access-the-return-value-of-a-promise-object-1bck
        //Api-Daten aus OpenWeatherMap!
        fetchWeatherHeute(res, result.city).then((heuteData) =>{
            fetchWeatherWoche(res, result.city).then((wocheData) =>{
                var wetterWocheJSON = getWetterWocheJSON(wocheData);
                res.render('weather', { 
                    temperaturHeute: heuteData,
                    wochentage: getDaysOfWeek(),
                    city: result.city,
                    wocheTemperatur: wetterWocheJSON
                });
            });
        });
    });
});

//Weather Api
router.get('/api/heute', (req, res) => {
    //hole aktuellen Citynamen aus der DB und dann lade das aktuelle Wetter aus der OpenWeatherMap Api
    var cityPromise = myMongoDB.loadSettingsData();
    cityPromise.then((result) =>{
        //jsonPromise => Api-Daten aus OpenWeatherMap!
        var jsonPromise = fetchWeatherHeute(res, result.city);
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

function getWetterWocheJSON(jsonData){
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
            "description": jsonData.list[i].weather[0].main.toString(),
            "weekday": getDaysOfWeek()[i-7*(i/8)] //weil es mit morgen anfängt!
        };
        
        wetterWocheJSON.push( JSONObject );
        if( i + 8 == 40 ){ //maximal werden 40 Wetterdaten geliefert (alle 3 Std für 5 Tage)
            i--;
        }
    }
    return wetterWocheJSON;
}

router.get('/api/woche', (req, res) => {
    //hole aktuellen Citynamen aus der DB und dann lade das aktuelle Wetter aus der OpenWeatherMap Api
    var cityPromise = myMongoDB.loadSettingsData();
    cityPromise.then((result) =>{
        //Promise Problem:
        //https://dev.to/ramonak/javascript-how-to-access-the-return-value-of-a-promise-object-1bck
        fetchWeatherWoche(res, result.city).then((jsonData) =>{
            var wetterWocheJSON = getWetterWocheJSON(jsonData);    
            res.send( JSON.parse( JSON.stringify(wetterWocheJSON)  ) );
        });
    });
});

module.exports = router;
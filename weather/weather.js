//Quelle: https://stackabuse.com/making-http-requests-in-node-js-with-node-fetch

const fetch = require('node-fetch');
// Beispiel URL "https://api.openweathermap.org/data/2.5/weather?q=osnabrueck&units=metric&appid=f4bbb65b843c759430db10f6da7ad568"


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
    var temperature=0.00;
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
    var temperature=0.00;
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

module.exports.fetchWeatherHeute = fetchWeatherHeute;
module.exports.fetchWeatherWoche = fetchWeatherWoche;
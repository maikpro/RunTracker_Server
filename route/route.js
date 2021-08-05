/*
    Route ist zum Anzeigen der gelaufenen Route da
    Die gelaufene Route soll aus der MongoDB gezogen werden und auf Google Maps angezeigt werden.
    Idee: Für jede gelaufene Route gibt es eine eindeutige ID!!
*/

function loadRoute(res){
    res.render('route');
}

module.exports.loadRoute = loadRoute;
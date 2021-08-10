
//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application-de
function loadSettings(res, myMongoDB){
    var promise = myMongoDB.loadSettingsData();
    // lädt settings.ejs aus Views
    promise.then((result) =>{
        res.render('settings', {
            result: result.city
        }); 
    });
}

function saveSettings(req, res, myMongoDB){
    //postData muss an MongoDB geschickt werden...
    myMongoDB.saveSettings( req.body );
    res.redirect(301, '/settings');
}

function deleteGPSData(res, myMongoDB){
    myMongoDB.deleteData(200, 'gpsData');
    res.redirect(301, '/settings');
}

module.exports.loadSettings = loadSettings;
module.exports.saveSettings = saveSettings;
module.exports.deleteGPSData = deleteGPSData;
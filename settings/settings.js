
//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application-de
function loadSettings(res, myMongoDB){
    var promise = myMongoDB.loadSettingsData();
    // lädt settings.ejs aus Views
    promise.then((result) =>{
        console.log("Promise: " + result.city);
        res.render('settings', {
            result: result.city
        }); 
    });
}

function saveSettings(req, res, myMongoDB){
    var postData = req.body;
    //var jsonData = JSON.parse(req.body)
    console.log(postData);

    //postData muss an MongoDB geschickt werden...
    myMongoDB.saveSettings( req.body );
    
    res.redirect(301, '/settings');
}

module.exports.loadSettings = loadSettings;
module.exports.saveSettings = saveSettings;
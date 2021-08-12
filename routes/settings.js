const express = require('express');
const router = express.Router();

//MongoDB Module
const myMongoDB = require("../database/mongodb");

//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application-de
function loadSettings(res){
    var promise = myMongoDB.loadSettingsData();
    // lädt settings.ejs aus Views
    promise.then((result) =>{
        res.render('settings', {
            result: result.city
        }); 
    });
}

function saveSettings(req, res){
    //postData muss an MongoDB geschickt werden...
    myMongoDB.saveSettings( req.body );
    res.redirect(301, '/settings');
}

function deleteGPSData(res){
    myMongoDB.deleteData(200, 'gpsData');
    res.redirect(301, '/settings');
}

//Settings: /settings
router.get('/', (req, res) => {
    loadSettings(res);
});

//https://stackoverflow.com/questions/24330014/bodyparser-is-deprecated-express-4
router.post('/save', (req, res) => {
    saveSettings(req, res);
});

router.post('/deleteGPSData', (req, res) => {
    deleteGPSData(res);
});


module.exports = router;
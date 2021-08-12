const { MongoClient } = require("mongodb");

// Connection URI
const uri = "mongodb://127.0.0.1:27017";

// Create a new MongoClient
const client = new MongoClient(uri);

// Database Name
const dbName = 'runtracker';




async function connectToMongoDB(){
    try {
        // Connect the client to the server
        await client.connect();
        
        // Establish and verify connection
        await client.db("admin").command({ ping: 1 });
        
        console.log("[MQTT:] connected successfully to MongoDB");
    
    } finally { 
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

//Test: db.gpsData.find()
function saveGPSData(gpsData){
    client.connect(() => {
        const db = client.db(dbName);
        
        //GpsDaten sollen NICHT ersetzt werden 
        const update = { $set: { bufferArray: gpsData.bufferArray } }
        const options = { upsert: true };

        db.collection('gpsData')
            .updateOne( {_id: 200}, update, options )
            //.insertOne()
            .then( result => {
                id = result.insertedId;
                console.log(
                    "[MONGODB:] GPS Daten wurden gespeichert!"
                );
            })
    });
}

function loadGPSData(){
    return new Promise( (res) => {
        client.connect(() => {
            const db = client.db(dbName);
            db.collection('gpsData')
                .findOne({}, (err, result) =>{
                    if(err) throw err;
                    res(result);
                });
        });
    });
}

//Test: db.settings.find()
function saveSettings(query){
    client.connect(() => {
        const db = client.db(dbName);
        //{ {_id: 100}, {city: "Hannover"} }
        const update = { $set: { city: query.city } };
        const options = { upsert: true }; //wenn Doc noch nicht existiert füge diesen hinzu. (upsert: true)
        //Quelle: https://docs.mongodb.com/drivers/node/fundamentals/crud/write-operations/upsert/
        
        db.collection('settings')
            //.insertOne(doc) //einfacher insert!
            .updateOne( {_id: 100}, update, options)
            .then( result => {
                console.log(
                    `[MONGODB:] Stadtname wurde auf "${query.city}" geändert!`
                );
            })
    });
}

/*Quellen: 
https://stackoverflow.com/questions/34158112/fetching-data-from-mongodb-through-nodejs-and-express-to-a-html-page
https://www.w3schools.com/nodejs/nodejs_mongodb_find.asp
https://stackoverflow.com/questions/55561598/waiting-for-async-findone-to-finish-before-returning-value
*/
function loadSettingsData(){
    return new Promise( (res) => {
        client.connect(() => {
            const db = client.db(dbName);
            db.collection('settings')
                .findOne({}, (err, result) =>{
                    if(err) throw err;
                    res(result);
                });
        });
    });
}

//gpsData haben ID: 200
function deleteData(id, collectionName){
    client.connect(() => {
        const db = client.db(dbName);
        db.collection(collectionName)
            .deleteOne({ _id: id })
    });
}

module.exports.connectToMongoDB = connectToMongoDB;
module.exports.saveGPSData = saveGPSData;
module.exports.loadGPSData = loadGPSData;
module.exports.saveSettings = saveSettings;
module.exports.loadSettingsData = loadSettingsData;
module.exports.deleteData = deleteData;
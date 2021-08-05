const { MongoClient } = require("mongodb");

// Connection URI
const uri = "mongodb://127.0.0.1:27017";

// Create a new MongoClient
const client = new MongoClient(uri);

// Database Name
const dbName = 'runtracker';




module.exports.connectToMongoDB = async function(){
    try {
        // Connect the client to the server
        await client.connect();
        
        // Establish and verify connection
        await client.db("admin").command({ ping: 1 });
        
        console.log("Connected successfully to server");
    
    } finally { 
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}


module.exports.saveSettings= (query) =>{
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
                id = result.insertedId;
                console.log(
                    `A document was inserted with the _id: ${result.insertedId}`,
                );
            })
    });
}

/*Quellen: 
https://stackoverflow.com/questions/34158112/fetching-data-from-mongodb-through-nodejs-and-express-to-a-html-page
https://www.w3schools.com/nodejs/nodejs_mongodb_find.asp
https://stackoverflow.com/questions/55561598/waiting-for-async-findone-to-finish-before-returning-value
*/
module.exports.loadSettingsData = () => {
    return new Promise( (res) => {
        client.connect(() => {
            const db = client.db(dbName);
            db.collection('settings')
                .findOne({}, (err, result) =>{
                    if(err) throw err;
                    console.log("loadSettingsData:", result);
                    //return result;
                    res(result);
                });
        });
    });

    
}
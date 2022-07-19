const mongoClient = require('mongodb').MongoClient
state = {
    db:null
}
module.exports = {
    connect: (done)=>{
        const url = "mongodb://localhost:27017" ;
        const dbname = "SCRAM" ; 
        mongoClient.connect(url,(err,data)=>{
            if(err)  return done(err)
            else{
                state.db = data.db(dbname);
                done()
            }
        })
    },
    get: ()=>{
        return state.db
    }
}
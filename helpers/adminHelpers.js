const bcrypt = require('bcrypt');
const db = require('../config/mongoConfig');
const collection = require ('../config/collections')


module.exports = {
    add_admin: (data) =>{
        let error = "username already exists";
        return new Promise( async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMINCOLLECTION).findOne({userName: data.userName});
            console.log(admin);
            if(!admin){
                data.password = await bcrypt.hash(data.password,10)
                db.get().collection(collection.ADMINCOLLECTION).insertOne(data).then((res)=>{
                    resolve(res)
                })
            }else{
                reject(error)
            }
        })
    },
    adminVerify: (data) =>{
        let error = "id or password doesn't match";
        let response ={};
        return new Promise( async (resolve, reject) => {
            let admin = await  db.get().collection(collection.ADMINCOLLECTION).findOne({userName:data.userName})
            if(admin) {
                await bcrypt.compare(data.password,admin.password).then((data)=>{
                    if(data){
                        response.admin = admin ;
                        response.status = true ; 
                        resolve(response)
                    }else reject (error)
                })
            } else reject(error);
        })
    }

}
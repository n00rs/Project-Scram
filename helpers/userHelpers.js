const bcrypt = require('bcrypt');
const collections = require('../config/collections')
const db = require('../config/mongoConfig')

module.exports = {
    userSignup: (data) => {

        let error = "Email Id or Mobile Number already exists "
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USERCOLLECTION).aggregate([{
                $match: {
                    $or: [
                        { email: data.email },
                        { phone: data.phone }]
                }
            }]).toArray()
            console.log(user);

            if (user[0] != null) {
                reject(error);
            }
            else {
                console.log(data);
                data.password = await bcrypt.hash(data.password, 10);
                data.block = false;
                db.get().collection(collections.USERCOLLECTION).insertOne(data).then((result) => {
                    resolve(result);
                }
                )
            }
        })
    },


userLogin: (data)=>{
    return new Promise( async (resolve, reject) => {
        
        let error = "Id or password dosen't match";

        let response = {};
        let user  = await db.get().collection(collections.USERCOLLECTION).findOne({email: data.email})
        if(user && !user.block){
            await bcrypt.compare(data.password,user.password).then((res)=>{
                if(res){
                    response.status = true;
                    response.user = user;
                    resolve(response);
                }else{
                    reject(error)
                }
            })
        }else if(user && user.block)  error = 'user blocked' ;
        reject(error)

    })
}
}
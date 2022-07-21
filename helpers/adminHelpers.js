const bcrypt = require('bcrypt');
const db = require('../config/mongoConfig');
const collection = require('../config/collections');
const objectId = require('mongodb').ObjectId


module.exports = {
    add_admin: (data) => {
        let error = "username already exists";
        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMINCOLLECTION).findOne({ userName: data.userName });
            console.log(admin);
            if (!admin) {
                data.password = await bcrypt.hash(data.password, 10)
                db.get().collection(collection.ADMINCOLLECTION).insertOne(data).then((res) => {
                    resolve(res)
                })
            } else {
                reject(error)
            }
        })
    },

    adminVerify: (data) => {
        let error = "id or password doesn't match";
        let response = {};
        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMINCOLLECTION).findOne({ userName: data.userName })
            if (admin) {
                await bcrypt.compare(data.password, admin.password).then((data) => {
                    if (data) {
                        response.admin = admin;
                        response.status = true;
                        resolve(response)
                    } else reject(error)
                })
            } else reject(error);
        })
    },

    fetchAllUsers: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USERCOLLECTION).find().toArray().then((userData) => {

                resolve(userData)
            })
        })
    },

    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USERCOLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                console.log('find', user);
                if (user.block) {

                    db.get().collection(collection.USERCOLLECTION).updateOne({ _id: objectId(userId) },
                        {
                            $set: {
                                block: false
                            }
                        }).then((result) => {
                            console.log(result);
                            resolve()
                        })
                } else {
                    db.get().collection(collection.USERCOLLECTION).updateOne({ _id: objectId(userId) },
                        {
                            $set: {
                                block: true
                            }
                        }).then((result) => {
                            console.log(result);
                            resolve()
                        })
                }
            })
        })
    },

    removeUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USERCOLLECTION).deleteOne({ _id: objectId(userId) }).then((result) => {
                console.log(result);
                resolve({ userRemoved: true });
            })

        })
    },

    fetchUser: (userId) => {
        console.log(userId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USERCOLLECTION).findOne({ _id: objectId(userId) }).then((result) => {
                resolve(result)
            })
        })
    },

    updateUserData: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USERCOLLECTION).updateOne({ _id: objectId(data.id) },
                {
                    $set:
                    {
                        phone: data.phone,
                        firstName: data.firstName,
                        secondName: data.secondName,
                        counntry: data.country,
                        gender: data.gender
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    addProduct: (data) => {
        let product = {
            "category": data.category,
            "subcategory": data.subcategory,
            "model": data.model,
            "modeldetials": {
                "name": data.modelname,
                "size": [data.small, data.medium, data.large, data.extra_extra_large, data.extra_large],
                "price": parseInt(data.price),
                "description": data.description,
                "features": data.features,
            }
        }
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTCOLLECTION).insertOne(product).then((result) => {
                console.log(result);
                resolve(result.insertedId)
            })
        })
    },




}
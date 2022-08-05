const bcrypt = require('bcrypt');
const db = require('../config/mongoConfig');
const collection = require('../config/collections');
// const collection = require('../config/collection');
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

        let sizeData = [data.small, data.medium,
        data.large, data.extra_extra_large,
        data.extra_large, data.none];

        sizeData = sizeData.filter(Boolean)                            //checking for any undefined values & coverting into array

        let size = Object.fromEntries(sizeData);

        size = arraryConverter(size)
        let product = {
            "category": data.category,
            "subcategory": data.subcategory,
            "model": data.model,
            "modelDetails": {
                "name": data.modelname,
                "size": size,
                "price": parseInt(data.price),
                "description": data.description,
                "features": data.features,
            }
        };

        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTCOLLECTION).insertOne(product).then((result) => {

                resolve(result.insertedId);
            })
        })
    },

    fetchAllProducts: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTCOLLECTION).find().toArray().then((result) => {
                console.log(result[0]);
                resolve(result)
            })
        })
    },

    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTCOLLECTION).deleteOne({ _id: objectId(productId) }).then((result) => {
                console.log(result, "delteprod");
                resolve({ itemRemoved: true })
            })
        })
    },

    fetchProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTCOLLECTION).findOne({ _id: objectId(productId) }).then((result) => {
                resolve(result)
            })
        })
    },

    editProduct: (data) => {

        let sizeData = [data.small, data.medium, data.large,
        data.extra_extra_large, data.extra_large, data.none];

        sizeData = sizeData.filter(Boolean)                            //checking for any undefined values & coverting into array

        let size = Object.fromEntries(sizeData);

        size = arraryConverter(size);

        console.log(size, 'post edit product');



        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTCOLLECTION).updateOne({ _id: objectId(data.productId) },
                {
                    $set: {
                        category: data.category,
                        subcategory: data.subcategory,
                        model: data.model,
                        'modelDetails.name': data.modelname,

                        'modelDetails.size': size,

                        'modelDetails.price': parseInt(data.price),

                        'modelDetails.stock': parseInt(data.stock),

                        'modelDetails.description': data.description,

                        'modelDetails.features': data.features

                    }
                }).then((result) => {
                    console.log(result);
                    resolve()
                })
        })
    },

    fetchCoupons: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPONCOLLECTION).find().toArray().then((result) => {
                console.log(result);
                resolve(result);
            })
        })
    },

    addCoupon: (data) => {
        const oneDay = 1000 * 60 * 60 * 24;
        const coupon = {
            couponName: data.couponName.toUpperCase(),
            category: data.category,
            discount: {
                price: parseInt(data.discountPrice),

                percentage: parseFloat(data.discountPercent / 100)
            },
            couponExpires: new Date(new Date().getTime() + (oneDay * parseInt(data.expiry)))

            // couponExpires: new Date(new Date().getTime() + 5000) 
        }

        console.log(coupon, 'adminhelper');
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPONCOLLECTION).find().toArray().then((result) => {
                console.log(result, "check");
                if (result[0] == null) {

                    db.get().collection(collection.COUPONCOLLECTION).createIndex({ "couponName": 1 }, { unique: true })

                    db.get().collection(collection.COUPONCOLLECTION).createIndex({ "couponExpires": 1 }, { expireAfterSeconds: 0 })

                    db.get().collection(collection.COUPONCOLLECTION).insertOne(coupon).then((result) => {
                        console.log(result, "after insertion");
                        resolve({ couponAdded: true })
                    })
                } else {
                    db.get().collection(collection.COUPONCOLLECTION).insertOne(coupon).then((result) => {
                        console.log(result, "second insertion");
                        resolve({ couponAdded: true })
                    })
                        .catch((err) => {
                            console.log(err, "second err");
                            reject({ couponAdded: false });
                        })
                }
            })
        })
    },

    fetchAllOrders: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDERCOLLECTION).find().toArray().then((result) => {
                console.log("al orders admin ", result);
                resolve(result)
            })
        })
    },

    updateOrderStatus: (data) => {
        const orderId = objectId(data.orderId) ;
        const prodId = data.prodId ;
        const orderStatus = data.orderStatus ;
        const updateSuccess = {success: `item marked as ${orderStatus} `}
        const updateFail = {fail: `failed to marked ${orderStatus}`}

        console.log(orderId, prodId, orderStatus, 'inside update');


        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDERCOLLECTION).updateOne({ _id: orderId, "orderData.order.item" : prodId }, {
                $set: {
                    "orderData.order.$.status": orderStatus,
                }
            })
                .then(result => result.modifiedCount ==1 ? resolve(updateSuccess): reject(updateFail) )
                .catch(error =>  reject({error: "monog went on leave on contact +919633138136"})) 
            })
        },
                                                                              // scene query (-_-)
                    // if (orderUpdate == 'shipped') {
                    //     db.get().collection(collection.ORDERCOLLECTION).aggregate([
                    //         { $match: { _id: orderId } },
                    //         { $unwind: "$orderData.order" },
                    //         {
                    //             $project:
                    //             {
                    //                 item: { $toObjectId: "$orderData.order.item" },
                    //                 quantity: "$orderData.order.quantity"
                    //             }
                    //         },
                    //         {
                    //             $lookup: {
                    //                 from: collection.PRODUCTCOLLECTION,
                    //                 localField: "item",
                    //                 foreignField: "_id",
                    //                 as: "orders"
                    //             }
                    //         },
                    //         { $unwind: "$orders" },

                    //         { $project: { product: "$orders._id", quantity: 1, stock: "$orders.modelDetails.stock" } },

                    //         { $project: { product: 1, stockLeft: { $subtract: ["$stock", "$quantity"] } } }

                    //     ]).toArray()
                    //         .then((result) => {
                    //             console.log(result, 'afteraggergation');
                    //         })
                    // }
                
    fetchOrderDetails: (orderId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDERCOLLECTION).findOne({ _id: objectId(orderId) }).then(result => resolve(result)).catch(e => reject(e))
        })
    },

    checkStock: (data) => {
        const orderId = objectId(data.orderId)
        const prodId = data.prodId
        const selectedSize = data.selectedSize;
        const quantity = parseInt(data.quantity);
        const confirmMsg ={orderConfirmed: "order confirmed"};
        const stockOutMsg = {stockOut:"Item out of stock or less quantity"};
        console.log(orderId);
        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCTCOLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                // console.log(product);
                let checkStock = product.modelDetails.size.find(arr => arr.size === selectedSize && +arr.stock >= quantity ? true : resolve(stockOutMsg));
                // let checkStock = (stock >= quantity) ? true : reject({ error: "out of stock" })

                console.log(checkStock, "insoie db");
                if (checkStock) {
                    // let newStock = stock - quantity;
                    db.get().collection(collection.PRODUCTCOLLECTION).updateOne({ _id: objectId(prodId), "modelDetails.size.size": selectedSize }, {

                        $inc: { "modelDetails.size.$.stock": -quantity }

                    }).then((result) => {
                        if(result.modifiedCount == 1){
                        db.get().collection(collection.ORDERCOLLECTION).updateOne({_id: orderId, "orderData.order.item": prodId},
                        {
                            $set:{"orderData.order.$.status": "confirmed" }

                        }).then(result=> resolve(confirmMsg))
                        .catch(e=> reject({error:'mongo loose mind2'}))
                    }
                    }).catch(e=> reject({error:'mongo loose mind2'}))
                }
            }).catch(e=> reject({error:'mongo loose mind1'}))
        })
    }







}


let arraryConverter = (obj) => {
    let keys = Object.keys(obj)
    let array = [];
    for (let index = 0; index < keys.length; index++) {
        array.push({
            size: keys[index],
            stock: parseInt(obj[keys[index]])
        })
    }
    return array;
}

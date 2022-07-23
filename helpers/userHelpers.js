const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
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


    userLogin: (data) => {
        return new Promise(async (resolve, reject) => {

            let error = "Id or password dosen't match";

            let response = {};
            let user = await db.get().collection(collections.USERCOLLECTION).findOne({ email: data.email })
            if (user && !user.block) {
                await bcrypt.compare(data.password, user.password).then((res) => {
                    if (res) {
                        response.status = true;
                        response.user = user;
                        resolve(response);
                    } else {
                        reject(error)
                    }
                })
            } else if (user && user.block) error = 'user blocked';
            reject(error)

        })
    },

    // fetchHelmets : ()=>{
    //     return new Promise((resolve, reject) => {
    //         db.get().collection(collections.PRODUCTCOLLECTION).find({category : 'helmet'}).toArray().then((result)=>{
    //             console.log(result);
    //             resolve(result)
    //     })
    //     })
    // },

    // fetchAccessories : ()=>{
    //     return new Promise((resolve, reject) => {
    //         db.get().collection(collections.PRODUCTCOLLECTION).find({category: 'accessories'}).toArray().then((result)=>{

    //             resolve(result)
    //         })
    //     })
    // },

    fetchCategory: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTCOLLECTION).find({
                $or:
                    [
                        { category: data }, { subcategory: data }
                    ]
            }).toArray().then((result) => {

                resolve(result);
            })
        })
    },

    fetchProduct: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTCOLLECTION).findOne({ _id: ObjectId(data) }).then((result) => {
                // console.log(result);
                resolve(result);
            })
        })
    },

    sortProduct: (data) => {
        console.log(data);
        if (data.sortType === 'price low to high') {
            return new Promise((resolve, reject) => {

                db.get().collection(collections.PRODUCTCOLLECTION).aggregate([{
                    $match: {
                        $or: [
                            { category: data.category }, { subcategory: data.category }
                        ]
                    }
                },
                {
                    $sort: { "modelDetails.price": 1 }
                }
                ]).toArray().then((result) => {
                    // console.log(result);
                    resolve(result)
                })
            })

        } else if (data.sortType === 'Price High To Low') {
            return new Promise((resolve, reject) => {
                db.get().collection(collections.PRODUCTCOLLECTION).aggregate([{
                    $match: {
                        $or: [{ category: data.category }, { subcategory: data.category }]
                    }
                },
                { $sort: { 'modelDetails.price': -1 } }
                ]).toArray().then((result) => {
                    resolve(result)
                })
            })
        } else if (data.sortType === 'alphabetically') {
            return new Promise((resolve, reject) => {
                db.get().collection(collections.PRODUCTCOLLECTION).aggregate([])
            })
        }
    },

    addToCart: (data, userId) => {

        let productObject = {

            item: ObjectId(data.id),
            name: data.name,
            subcategory: data.subcategory,
            category: data.category,
            price: parseInt(data.price),

            size: [data.size],
            quantity: 1,

        }
        console.log(productObject);
        return new Promise(async (resolve, reject) => {
            const cart = await db.get().collection(collections.CARTCOLLECTION).findOne({ user: ObjectId(userId) })

            console.log(cart, 'check');
            if (!cart) {
                let cartItem = {
                    user: ObjectId(userId),
                    products: [productObject],
                    total: parseInt(0),
                }

                db.get().collection(collections.CARTCOLLECTION).insertOne(cartItem).then((result) => {
                    resolve(result);
                    console.log(result);
                })
            } else {
                // console.log(result.products.item);
                const productExist = cart.products.findIndex(products => products.item == data.id)


                console.log(productExist);
                if (productExist != -1) {
                    db.get().collection(collections.CARTCOLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(data.id) },
                        {
                            $inc: { "products.$.quantity": 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {

                    db.get().collection(collections.CARTCOLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push:
                                { products: productObject }
                        }).then((result) => {
                            console.log(result);
                            resolve(result);
                        })

                }
            }
        })

    },

    fetchCart: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CARTCOLLECTION).find({ user: ObjectId(userId) }).toArray().then((result) => {
                console.log(result[0]);
                resolve(result[0])
            })
        })
    },

    fetchCartCount: (userId) => {
        console.log(userId);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CARTCOLLECTION).aggregate([
                { $match: { user: ObjectId(userId) } },
                { $project: { quantity: { $sum: "$products.quantity" } } }
            ]).toArray().then((result) => {
                console.log(result[0]);
                // count = resolve[0].quantity 
                resolve(result[0].quantity)
            })

        })
    },
    changeQuantity:(data)=>{
        return new Promise((resolve, reject) => {
            let prodId = data.id;
            let cartId = data.cartId;
            db.get().collection(collections.CARTCOLLECTION).findOne({_id:ObjectId(cartId),})
        })
    }


}
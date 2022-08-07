require('dotenv').config()
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
const collections = require('../config/collections')
const db = require('../config/mongoConfig');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

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


    userLogin: (data, sessionId) => {
        return new Promise(async (resolve, reject) => {

            let error = "Id or password dosen't match";

            let response = {};
            let user = await db.get().collection(collections.USERCOLLECTION).findOne({ email: data.email })
            if (user && !user.block) {
                await bcrypt.compare(data.password, user.password).then((res) => {

                    if (res) {
                        db.get().collection(collections.WISHLISTCOLLECTION).findOneAndDelete({ user_or_sessionId: sessionId }).then((sessionWishlist) => {
                            console.log(sessionWishlist);

                            if (sessionWishlist.value) {
                                let products = sessionWishlist.value.products

                                console.log(products);

                                db.get().collection(collections.WISHLISTCOLLECTION).updateOne({ user_or_sessionId: user._id.toString() },

                                    {
                                        $push:

                                            { products: { $each: products } }
                                    },
                                    { upsert: true })
                                    .then((res) => console.log(res))
                            }
                        })
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

    // CART SECTION


    addToCart: (data, userId) => {

        const selectedSize = data.selectedSize

        let productObject = {

            item: ObjectId(data.id),
            name: data.name,
            subcategory: data.subcategory,
            category: data.category,
            price: parseInt(data.price),
            selectedSize: selectedSize,
            quantity: 1,
        }

        const successMsg = { success: "Item added to the cart" }
        console.log(productObject, "waytocart");

        return new Promise(async (resolve, reject) => {
            const cart = await db.get().collection(collections.CARTCOLLECTION).findOne({ user: ObjectId(userId) })

            console.log(cart, 'cart check');
            if (!cart) {
                let cartItem = {
                    user: ObjectId(userId),
                    products: [productObject],
                    total: parseInt(0),
                }
                db.get().collection(collections.CARTCOLLECTION).insertOne(cartItem).then((result) => { resolve(successMsg); console.log(result); })
            }
            else {
                // console.log(result.products.item);
                const productExist = cart.products.findIndex(products => products.item == data.id)
                const checksize = cart.products.some(p => p.selectedSize === selectedSize)

                console.log(productExist);
                if (productExist != -1 && checksize) {
                    db.get().collection(collections.CARTCOLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(data.id) },
                        {
                            $inc: { "products.$.quantity": 1 }

                        }).then(() => resolve(successMsg))
                } else {

                    db.get().collection(collections.CARTCOLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push:
                                { products: productObject }
                        }).then((result) => { console.log(result); resolve(successMsg); })
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
                console.log(result);
                if (result[0] == null) resolve(0);
                else resolve(result[0].quantity)
            })

        })
    },
    changeCartQuantity: (data) => {
        try {

            let prodId = ObjectId(data.id);
            let cartId = ObjectId(data.cartId);
            let count = parseInt(data.count);
            let quantity = parseInt(data.quantity);

            return new Promise((resolve, reject) => {
                if (quantity === 1 && count === -1) {
                    db.get().collection(collections.CARTCOLLECTION).updateOne({ _id: cartId },
                        {
                            $pull: { products: { item: prodId } }
                        }).then(() => {
                            resolve({ productRemoved: true })
                        })
                } else {
                    db.get().collection(collections.CARTCOLLECTION).updateOne({ _id: cartId, "products.item": prodId },
                        { $inc: { "products.$.quantity": count } }
                    ).then(() => {
                        resolve({ productAdded: true })
                    })
                }
            })


        } catch (error) {
            console.log(error);
        }
    },
    removeCartItem: (data) => {
        try {

            const cartId = ObjectId(data.cartId);
            const prodId = ObjectId(data.prodId);

            return new Promise((resolve, reject) => {

                db.get().collection(collections.CARTCOLLECTION).updateOne({ _id: cartId },
                    {
                        $pull:
                        {
                            products: { item: prodId }
                        }
                    }
                ).then(() => {
                    resolve({ itemRemoved: true })
                })

            })

        } catch (error) {
            console.log(error);
        }

    },
    totalAmount: (cartId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collections.CARTCOLLECTION).aggregate([{

                $match: { _id: ObjectId(cartId) }
            },
            { $unwind: "$products" },
            {
                $group: {
                    _id: null,
                    total:
                    {
                        $sum:
                        {
                            $multiply: [
                                "$products.price", "$products.quantity"
                            ]
                        }
                    }
                }
            }

            ]).toArray().then((result) => {
                // console.log(result[0].total);
                resolve(result[0])
            })
        })

    },

    updateSize: (data) => {

        console.log(data);
        const cartId = ObjectId(data.cartId);
        const selectedSize = data.selectedSize;
        const prodId = ObjectId(data.prodId);

        return new Promise((resolve, reject) => {
            db.get().collection(collections.CARTCOLLECTION).updateOne({
                _id: cartId,
                "products.item": prodId
            },

                {
                    $set: { 'products.$.selectedSize': selectedSize }
                }).then((result) => {
                    console.log(result, ' aftr updar');
                    resolve({ sizeSelected: true })
                })
                .catch((error) => {
                    console.error(error, 'update faile');
                    reject({ sizeSelected: false })
                })
        })

    },

    checkCouponCode: (couponCode, cartTotal) => {
        const couponName = couponCode.toUpperCase();
        console.log(couponCode);
        return new Promise((resolve, reject) => {

            db.get().collection(collections.COUPONCOLLECTION).findOne({ couponName: couponName }).then((result) => {
                console.log(result, 'inside coupon');
                if (result == null) reject({ validCoupon: false })

                else {
                    let discountValue = parseFloat(cartTotal * result.discount.percentage);
                    console.log(discountValue);
                    if (discountValue > result.discount.price) {

                        resolve({
                            validCoupon: true,
                            discount: result.discount.price
                        })
                    } else {
                        resolve({
                            validCoupon: true,
                            discount: discountValue
                        })
                    }
                }
            })
        })
    },



    // USER PROFILE SECTION

    fetchUserData: (userId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collections.USERCOLLECTION).findOne({ _id: ObjectId(userId) }).then((result) => {
                console.log(result);
                resolve(result);
            })
        })
    },

    verifyPhone: (userId, newPhone) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collections.USERCOLLECTION).updateOne({ _id: ObjectId(userId) },
                {
                    $set: {
                        phoneVerified: true,
                        phone: newPhone
                    }
                }).then((result) => {
                    console.log(result, "numberverify");
                    resolve()
                })
        })
    },

    addAddress: (data) => {
        const userId = ObjectId(data.userId);
        const address = {
            _id: ObjectId(),
            building_name: data.building_name,
            street: data.street,
            city: data.city,
            country: data.country,
            pincode: data.pincode,
        }
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USERCOLLECTION).updateOne({ _id: userId },
                {
                    $push: { address: address },
                    $set: { addressAdded: true }
                },
            ).then((result) => {
                console.log(result);
                resolve()
            })
        })
    },

    updateName: (data) => {
        const userId = ObjectId(data.userId);
        const firstName = data.firstName;
        const lastName = data.lastName;
        return new Promise((resolve, reject) => {

            db.get().collection(collections.USERCOLLECTION).updateOne({ _id: userId },
                {
                    $set:
                    {
                        firstName: firstName,
                        lastName: lastName,
                    }
                }).then((result) => {
                    console.log(result);
                    resolve()
                })
        })

    },

    removeAddress: (data) => {
        const userId = ObjectId(data.userId);
        const addressId = ObjectId(data.addressId);

        return new Promise((resolve, reject) => {
            db.get().collection(collections.USERCOLLECTION).updateOne({ _id: userId },
                {
                    $pull: {
                        address: { _id: addressId }
                    }
                }).then((result) => {

                    console.log(result, 'itemremoved');

                    resolve(result)
                })
                .catch((err) => {
                    console.error(err, 'db mafun');
                    reject(err)
                })
        })
    },

    checkEmail: (data) => {
        console.log(data);
        console.log(`+91 ${data.userInput}`);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USERCOLLECTION).find({
                $or:
                    [{ email: data.userInput },
                    { phone: `+91${data.userInput}` }
                    ]
            }).toArray().then((result) => {
                console.log(result);
                if (result[0] != null) resolve()
                else reject()
            })
                .catch((err) => {
                    console.log(err);
                })
        })
    },
    changePassword: (data) => {


        return new Promise(async (resolve, reject) => {
            const userInput = data.userInput;
            const newPassword = await bcrypt.hash(data.newPassword, 10);

            db.get().collection(collections.USERCOLLECTION).updateOne({
                $or: [
                    { email: userInput },
                    { phone: `+91${userInput}` }
                ]
            }, {
                $set: { password: newPassword }
            })
                .then((result) => {

                    console.log(result);
                    resolve()

                })
                .catch((err) => {
                    console.log(err);
                    let Error = "something wrong on server"
                    reject(Error);
                })
        })
    },


    // WISH LIST SECTION


    addToWishlist: (id, prodId, user) => {                                                         //doing this in a different way other than add to cart method  ("just to use an lookup in getting products sections")
        // console.log(id,"session", user,"user",prodId,"inside addto wish");
        const oneDay = 1000 * 60 * 60 * 24;

        if (user) {
            var wishlist = {
                user_or_sessionId: id,
                products: [ObjectId(prodId)]
            }
        } else {
            wishlist = {
                user_or_sessionId: id,
                products: [ObjectId(prodId)],
                endSessionAt: new Date(new Date().getTime() + oneDay)                                                        //creating a field with date which removes the doc when it expires
            }
        }
        console.log(wishlist);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.WISHLISTCOLLECTION).findOne({ user_or_sessionId: id }).then((result) => {
                console.log(result, 'wishlist');
                if (result == null) {

                    db.get().collection(collections.WISHLISTCOLLECTION).createIndex({ "endSessionAt": 1 }, { expireAfterSeconds: 0 })             //creating index for date field to auto remove the doc past date

                    db.get().collection(collections.WISHLISTCOLLECTION).insertOne(wishlist).then((result) => {

                        console.log(`add new wish ${result}`);
                        resolve({ success: "Item added to wishlist" })
                    })
                } else {
                    const checkProd = result.products.find(product => product == prodId)
                    console.log(`checkprodlog ${checkProd}`);
                    if (checkProd != undefined) {

                        let message = "product already exist in wishlist";
                        reject({ success: message })
                    } else {
                        db.get().collection(collections.WISHLISTCOLLECTION).updateOne({ user_or_sessionId: id },
                            {
                                $push: { products: ObjectId(prodId) }

                            }).then((result) => {
                                console.log(result, 'after push');
                                resolve({ success: "wishlist updated " })
                            })
                    }

                }
            })
        })
    },

    fetchWishlist: (wishId) => {
        console.log(wishId);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.WISHLISTCOLLECTION).aggregate([
                {
                    $match:
                        { user_or_sessionId: wishId }
                },
                {
                    $lookup: {
                        from: collections.PRODUCTCOLLECTION,
                        localField: "products",
                        foreignField: "_id",
                        as: "products"

                    }
                },
                {
                    $project: { products: 1 }
                }
            ]).toArray().then((result) => {
                console.log(result[0]);
                resolve(result[0])
            })
        })
    },

    removeWishlistItem: (wishlistId, prodId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collections.WISHLISTCOLLECTION).updateOne({ _id: ObjectId(wishlistId) },
                {
                    $pull: { products: ObjectId(prodId) }
                }).then((result) => {
                    console.log(result, 'wish remoed');

                    resolve({ status: "item Removed from wishlist" })

                }).catch((error) => {
                    console.log(error, 'wishremove error');
                    reject({ status: 'opps something went wrong try again later' })
                })
        })
    },

    fetchWishlistCount: (wishId) => {
        console.log(wishId);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.WISHLISTCOLLECTION).findOne({ user_or_sessionId: wishId }).then((result) => {
                let count = (result == null) ? 0 : result.products.length
                // let count = result.products.length
                resolve(count)
            })
        })
    },


    //ORDERS SECTIONS


    newOrder: (data, user) => {
        const address = JSON.parse(data.address);
        const orderData = JSON.parse(data.orderDetails);
        const userId = ObjectId(user);
        const orderObj = {
            user: userId,
            address: address,
            orderData: orderData,
            paymentMethod: data.paymentMethod,
            status: 'order-placed',
            date: new Date().toLocaleString(),
        }
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDERCOLLECTION).insertOne(orderObj).then((result) => {
                console.log(result, 'new order');
                db.get().collection(collections.CARTCOLLECTION).deleteOne({ user: userId })

                resolve({ orderPlaced: true })


            })
                .catch((error) => {
                    console.log(error, 'new order');
                    reject({ orderPlaced: false })
                })
        })
    },

    fetchOders: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDERCOLLECTION).find({ user: ObjectId(userId) }).toArray().then((result) => {
                // console.log(result,'order');
                resolve(result)
            })
        })
    },

    stripeCheckOut: (data, user) => {

        const address = JSON.parse(data.address);
        const orderData = JSON.parse(data.orderDetails);
        const userId = ObjectId(user);

        console.log("stricheck out", orderData, address)

        return new Promise(async (resolve, reject) => {

            const customer = await stripe.customers.create({
                     address:{
                        city: address.city,
                        line1: address.building_name,
                        line2: address.street,
                        postal_code: address.pincode,
                     },
                     email: address.email,
                     name: address.name,
                     phone: address.phone,
                     shipping:{
                        address:{
                            city: address.city,
                            line1: address.building_name,
                            line2: address.street,
                            postal_code: address.pincode,
                         
                         },
                         name: address.name,
                         phone: address.phone,
                     },
                     metadata: {
                        userId: user,
                     }
            })
            const session = await stripe.checkout.sessions.create({
                success_url: `${process.env.HOSTED_URL}/order-confirmation`,
                cancel_url: `${process.env.HOSTED_URL}/cart`,
                mode: `payment`,
                payment_method_types: [`card`],
                client_reference_id: user,
                customer: customer.id,
                line_items: [{
                    price_data: {
                        currency: 'inr',
                        unit_amount: orderData.amount * 100,
                        product_data: {
                            name: "grand total",
                        },
                    },

                    quantity: 1,
                },

                ],
                payment_intent_data:{
                    receipt_email:address.email,
                    metadata:{
                        orderId: "orderId"
                    },
                },
             
            })
            // console.log(session);
            session.url ? resolve({url:session.url}) : reject({err:"stripe out of station"}) 
        })
    }

}

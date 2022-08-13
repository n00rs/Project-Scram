
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
const collections = require('../config/collections')
const db = require('../config/mongoConfig');

module.exports = {
    userSignup: (data) => {
        console.log(data)
        coupon = {
            couponName: (data.email + "FIrst10%").toUpperCase(),
            category: "ONE TIME",
            discount: { "price": 1000, "percentage": 0.1 },
        }

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
                    console.log(result)
                    coupon.userId = result.insertedId;
                    db.get().collection(collections.COUPONCOLLECTION).insertOne(coupon).then(res => resolve(res)).catch(err => reject(err))
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

    search: (searchInput, callback, error) => {
        let searchKey = searchInput.searchKey;
        
        db.get().collection(collections.PRODUCTCOLLECTION).find({
            "modelDetails.name": { $regex: searchKey ,$options: 'i'}
        }).limit(5).toArray()
        .then(res=> callback(res))
        .catch(err=> error({err: "server out of service"}))
        
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


    addToCart: (data, userID) => {
        console.log(data, 'inside add to cart');
        const prodId = ObjectId(data.prodId);
        const userId = ObjectId(userID);
        const selectedSize = data.selectedSize;
        const successMsg = { success: "Item added to the cart" };
        const errorMsg = { fail: "failed to update cart login or please try again later or " };


        return new Promise(async (resolve, reject) => {

            let product = await db.get().collection(collections.PRODUCTCOLLECTION).findOne({ _id: prodId })

            if (!product) reject(errorMsg)
            else {
                let productObject = {
                    item: prodId,
                    name: product.modelDetails.name,
                    subcategory: product.subcategory,
                    category: product.category,
                    size: product.modelDetails.size,
                    price: parseInt(product.modelDetails.price),
                    selectedSize: selectedSize,
                    quantity: 1,
                }
                const cart = await db.get().collection(collections.CARTCOLLECTION).findOne({ user: userId })

                if (!cart) {
                    let cartItem = {
                        user: userId,
                        products: [productObject],
                    }
                    db.get().collection(collections.CARTCOLLECTION).insertOne(cartItem).then((result) => { resolve(successMsg); console.log(result, "new cart"); }).catch(err => reject(errorMsg))
                }
                else {
                    // console.log(cart);
                    // const productExist = cart.products.some(products => { (products.item == data.prodId)})
                    // const checksize = cart.products.some(products => (products.selectedSize === selectedSize))

                    // // const checksize = cart.products.every(product => {console.log(product);(product.selectedSize === selectedSize && product.item === data.prodId)?true:false})

                    const productExist = cart.products.filter(id => id.item == data.prodId).some(size => size.selectedSize == selectedSize)

                    console.log(productExist, "[rpde");
                    if (productExist) {
                        db.get().collection(collections.CARTCOLLECTION).updateOne({ user: userId, 'products.item': prodId, 'products.selectedSize': selectedSize },
                            {
                                $inc: { "products.$.quantity": 1 }

                            }).then((result) => { console.log(result, "quantity"); resolve(successMsg); }).catch(err => reject(errorMsg))
                    } else {

                        db.get().collection(collections.CARTCOLLECTION).updateOne({ user: userId },
                            {
                                $push:
                                    { products: productObject }
                            }).then((result) => { console.log(result, " "); resolve(successMsg); }).catch(err => reject(errorMsg))
                    }
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

            let prodId = ObjectId(data.prodId);
            let cartId = ObjectId(data.cartId);
            let count = parseInt(data.count);
            let quantity = parseInt(data.quantity);
            let size = data.selectedSize
            console.log(size);
            return new Promise((resolve, reject) => {
                if (quantity === 1 && count === -1) {
                    db.get().collection(collections.CARTCOLLECTION).updateOne({ _id: cartId },
                        {
                            $pull: { products: { selectedSize: size, item: prodId } }
                        }).then(() => {
                            resolve({ productRemoved: true })
                        }).catch(err => reject({ productRemoved: false }))
                } else {
                    db.get().collection(collections.CARTCOLLECTION).updateOne({ _id: cartId, "products.item": prodId, "products.selectedSize": size },
                        { $inc: { "products.$.quantity": count } }
                    ).then(() => resolve({ productAdded: true }))
                        .catch(err => reject({ productAdded: false }))
                }
            })


        } catch (error) {
            console.log(error);
        }
    },

    removeCartItem: (data) => {
        const cartId = ObjectId(data.cartId);
        const prodId = ObjectId(data.prodId);
        const size = data.selectedSize;
        return new Promise((resolve, reject) => {

            db.get().collection(collections.CARTCOLLECTION).updateOne({ _id: cartId, },
                {
                    $pull:
                    {
                        products: { selectedSize: size, item: prodId }
                    }
                }
            ).then(() => resolve({ itemRemoved: true }))
                .catch(err => reject({ itemRemoved: false }))
        })
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
                    let discountPrice = result.discount.price;
                    let discountPercent = result.discount.percentage;
                    let discountValue = parseFloat(cartTotal * discountPercent);
                    console.log(discountValue);
                    if (discountValue > discountPrice) {
                        let newTotal = parseInt(cartTotal - discountPrice)
                        resolve({
                            validCoupon: true,
                            discount: discountPrice,
                            total: newTotal,
                        })
                    } else {
                        let newTotal = parseInt(cartTotal - discountValue)
                        resolve({
                            validCoupon: true,
                            discount: discountValue,
                            total: newTotal,
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


    newOrder: (data, userID, userCart, cartTotal, discountData) => {
        // console.log(data,userID,'user',userCart,"cart",cartTotal,"disc",discountData,"inside User ");

        const address = JSON.parse(data.address);
        let orderData = {
            items: userCart.products.filter(product => delete product.size),
            cartTotal: cartTotal,
            discountData: discountData,
        }
        let status = (data.paymentMethod) === 'COD' ? 'order-placed' : 'pending'
        // console.log(orderData.items,'orderdata')
        const userId = ObjectId(userID);
        const orderObj = {
            userId: userId,
            address: address,
            orderData: orderData,
            paymentMethod: data.paymentMethod,
            status: status,
            date: new Date().toLocaleString(),
        }
        // console.log(orderObj,'orderobj');
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDERCOLLECTION).insertOne(orderObj).then((result) => {
                // console.log(result, 'new order');
                db.get().collection(collections.CARTCOLLECTION).deleteOne({ user: userId })

                status === 'order-placed' ? resolve({ orderPlaced: true }) : resolve({ orderId: result.insertedId })
            })
                .catch((error) => {
                    console.log(error, 'new order');
                    reject({ orderPlaced: false })
                })
        })
    },

    fetchOders: (data, userid) => {
        if (data.page < 0) throw new Error('invalid page number')
        const userId = ObjectId(userid);
        const page = parseInt(data.page) || 1;
        const limit = 2;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const result = {};
        result.previous = startIndex > 0 ? { page: page - 1 } : null
        return new Promise((resolve, reject) => {

            db.get().collection(collections.ORDERCOLLECTION).find({ userId: userId }).count().then(count => {
                result.next = endIndex < count ? { page: page + 1 } : null



                db.get().collection(collections.ORDERCOLLECTION).find({ userId: userId })
                    .sort({ _id: -1 })
                    .limit(limit)
                    .skip(startIndex)
                    .toArray()
                    .then((orders) => {
                        // console.log(orders , 'order');
                        result.orders = orders
                        resolve(result)
                    }).catch(err => reject(err))
            }).catch(err => reject(err))
        })
    },

    updatePaymentStatus: (orderId, txnId, status, reciept = null) => {
        console.log(' insidestat');
        let mongoErr = "sorry server error down we'll update your order status soon"
        return new Promise((resolve, reject) => {

            db.get().collection(collections.ORDERCOLLECTION).updateOne({ _id: ObjectId(orderId) },
                {
                    $set: {
                        "status": status,
                        "paymentReciept": reciept,
                        "TransactionId": txnId
                    }
                }).then(result => resolve(result))
                .catch(err => reject(mongoErr))
        })
    },


    deleteCoupon: (userId) => {
        db.get().collection(collections.COUPONCOLLECTION).deleteOne({ userId: ObjectId(userId) }).then(res => console.log(res)).catch(err => console.log(err))
    },

    // stripeFail: (orderId, chargeId) => {
    //     return new Promise((resolve, reject) => {
    //         db.get().collection(collections.ORDERCOLLECTION).updateOne({ _id: ObjectId(orderId) },
    //             {
    //                 $set: {
    //                     "status": "payment - failed",
    //                     "paymentId": chargeId
    //                 }
    //             }).then(res => resolve(res))
    //             .catch(err => reject(err))
    //     })
    // }
    // updateOrderStatus: (orderData) => {
    //     console.log(orderData)
    //     const orderId = ObjectId(orderData.orderId);
    //     const prodId = ObjectId(orderData.prodId);
    //     const selectedSize = orderData.selectedSize;
    //     // const currentStatus = orderData.currentStatus ? orderData.currentStatus : null;
    //     const newStatus = orderData.newStatus ;
    //     return new Promise((resolve, reject) => {
    //         db.get().collection(collections.ORDERCOLLECTION).updateOne(
    //             {
    //                 _id: orderId,
    //                 "orderData.items.item": prodId,
    //                 "orderData.items.selectedSize": selectedSize,
    //             },
    //             {
    //                 $set: {
    //                     "orderData.items.$.status": newStatus
    //         }
    //             }
    //         ).then(res=> {res.modifiedCount = 1 ? resolve() : reject() } ).catch(err => reject(err))


    //     })

    // }
}


function productExist(arr) {

}
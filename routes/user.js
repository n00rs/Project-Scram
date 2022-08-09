require('dotenv').config
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser')
const twilio = require('../config/twilio');
const userHelpers = require('../helpers/userHelpers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const verifyUser = (req, res, next) => {
    if (req.session.loggedIn) next()
    else res.redirect('/login')
}



router.get('/', async (req, res) => {
    console.log(req.sessionID, '1sess');
    console.log(req.session.id, "session id");
    let user1 = req.session.user;
    let wishId = (user1) ? user1._id : req.sessionID;
    let cartCount = null;
    let wishlistCount = null;
    wishlistCount = await userHelpers.fetchWishlistCount(wishId)
    if (user1) {
        cartCount = await userHelpers.fetchCartCount(user1._id);
    }
    console.log(cartCount);
    res.render("user/landing-page", { user: true, cartCount, user1, wishlistCount });
})


// user -- login

router.get('/login', (req, res) => {
    if (req.session.loggedIn) res.redirect('/')

    else {

        res.render('user/login', { idError: req.session.idError });
        req.session.idError = false;
    }
})

router.post('/login', (req, res) => {
    let sessionId = req.sessionID
    userHelpers.userLogin(req.body, sessionId).then((result) => {
        if (result.status) {
            req.session.loggedIn = true;
            req.session.user = result.user;
            res.redirect('/')
        }
    })
        .catch((err) => {
            req.session.idError = err;
            res.redirect('/login')
        })
})

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/')
})

// user--signup

router.get('/signup', (req, res) => {

    res.render('user/signup', { user: true, idError: req.session.Error });
    req.session.Error = false;

})


router.post('/signup', (req, res) => {
    console.log(req.body);
    userHelpers.userSignup(req.body).then((result) => {
        res.redirect('/login')
    })
        .catch((err) => {
            req.session.Error = err;
            res.redirect('/signup')
        })

})

router.get('/category', async (req, res) => {
    try {
        let user1 = req.session.user;
        let wishId = (user1) ? user1._id : req.sessionID
        let category = req.query.category;
        let filterSize = req.query.size;
        let sortBy = req.query.sort;
        let cartCount = null;
        let wishlistCount = null;

        wishlistCount = await userHelpers.fetchWishlistCount(wishId);

        if (user1) cartCount = await userHelpers.fetchCartCount(user1._id);

        console.log(req.query, "category");
        if (!req.query) throw new Error('opps something went wrong')


        console.log(sortBy, filterSize, category,);

        let products = await userHelpers.fetchCategory(category);

        if (filterSize != '') products = products.filter(x => x.modelDetails.size.some(y => y.size == filterSize));

        if (sortBy != '') products = sort(sortBy, products);

        res.render('user/category', { user: true, user1, category, products, filterSize, sortBy, cartCount, wishlistCount })


    } catch (error) {
        console.log(error, 'error in loading category');
    }

})

// router.get('/accessories', async (req,res)=>{

//     let accessories = await userHelpers.fetchAccessories()

//     res.render('user/accessories',{user:true, accessories})
// })

// router.get('/accessories/:sub',async (req,res)=>{
//     try {
//             let subcategory = req.params.sub
//             let accessoriesSub = await userHelpers.fetchSub(subcategory);


//             if(subcategory == 'visors')               res.render('user/accessories-visors',{user:true, accessoriesSub});
//             else if (subcategory == 'communications')  res.render('user/accessories-communication',{user:true, accessoriesSub});
//             else if (subcategory == 'pads')            res.render('user/accessories-interiors',{user:true,accessoriesSub }) 

//     } catch (error) {
//         console.log(error);
//     }
// })
router.get('/view-product/:id', async (req, res) => {
    let id = req.params.id
    let product = await userHelpers.fetchProduct(id);
    console.log(product);
    res.render('user/view-product', { user: true, product })
})

// router.get('/sort', (req, res) => {
//     console.log(req.query);
//     console.log(req.query.sortType);

//     userHelpers.sortProduct(req.query).then((result) => {
//         console.log(result);
//         res.json(result);

//     })
// })

router.get('/filter-size', async (req, res) => {
    try {
        // console.log(req.query, 'sort size');

        // let category = req.query.category ;
        // let filterSize = req.query.size ;
        // let sortBy = req.query.sort ;
        // console.log(sortBy) ;
        let category = "touring"
        let products = await userHelpers.fetchCategory(category);

        // if (filterSize != '') products = products.filter(x => x.modelDetails.size.some(y => y.size == filterSize))

        // if(sortBy != '') products = sort(sortBy,products)

        // console.log(products,'after sorting');

        // console.log('products', category, 'category ', filterSize, 'value', 'last');

        res.render('user/category', { user: true, products, })

    } catch (error) {
        console.log(error, "errrsort in");

    }

})


// CART  ROUTES


router.post('/add-to-cart', verifyUser, (req, res) => {
    try {
        // console.log(req.body,"way to cart") ;
        let user = req.session.user;
        if (!user) throw new Error("no user")

        userHelpers.addToCart(req.body, user._id).then(result => res.json(result)).catch(err => { res.json(err); console.log(err, 'err in order'); })
    } catch (error) {
        console.log(error, 'ths one');
        let errorMsg = "Please Login and try again "
        res.json({ error: errorMsg })
    }

})

router.get('/cart', verifyUser, async (req, res) => {

    try {

        const userId = req.session.user._id;

        let cartItems = await userHelpers.fetchCart(userId);

        if (cartItems == null) var total = 0

        else total = await userHelpers.totalAmount(cartItems._id)
        // console.log(cartItems);
        req.session.total = total                                                            //saving total amount for further use
        res.render('user/cart', { user: true, cartItems, total })
    } catch (error) {
        console.log(error, 'err in the /cart');
    }
})

router.post('/changeQuantity', (req, res) => {
    try {
        console.log(req.body, 'bodychnge cart');
        // console.log(req.query);
        userHelpers.changeCartQuantity(req.body).then(async (result) => {

            result.total = await userHelpers.totalAmount(req.body.cartId)
            req.session.total = result.total                                                         //saving total amount for further use
            res.json(result)
        }).catch(err => res.json(err))
    } catch (error) {
        console.log(error, 'error in chngqty');
    }

})

router.delete("/remove-cart-item/:cartId/:prodId/:selectedSize", (req, res) => {
    try {
        console.log(req.params, "user params");

        userHelpers.removeCartItem(req.params).then(result => res.json(result))
            .catch(err => res.json(err))
    } catch (error) {
        console.log(error, "in delet cart");
    }
})

router.post('/cart/confirm-coupon', (req, res) => {
    try {
        let couponCode = req.body.code;
        let cartTotal = req.session.total.total;

        userHelpers.checkCouponCode(couponCode, cartTotal).then(result => res.json(result)).catch(error => res.json(error))

    } catch (error) {
        console.log(error);
    }
})

router.put('/cart/update-size', (req, res) => {
    // console.log(`${req.body.cartId} body ${req.query.cartId} query ${req.params.cartId}`);
    try {

        userHelpers.updateSize(req.body).then((result) => {
            console.log(result, 'result in then');
            res.json(result)
        })
            .catch((error) => {
                console.log(error, 'catch in res.');
                res.json(error)
            })

    } catch (error) {
        console.log(error, 'err in /updatesize');
    }

})

// WISHLIST

router.get('/wishlist', async (req, res) => {
    try {

        const wishId = (req.session.user) ? req.session.user._id : req.sessionID;
        let wishlistCount = await userHelpers.fetchWishlistCount(wishId);
        let wishlist = await userHelpers.fetchWishlist(wishId)

        console.log(wishlist, "wishlist");

        res.render('user/wishlist', { user: true, wishlist, wishlistCount })

    } catch (error) {
        console.log(error);
    }
})

router.post('/add-to-wishlist', (req, res) => {
    console.log(req.body);
    try {
        const user = (req.session.user) ? true : false;

        const id = (user) ? req.session.user._id : req.sessionID;

        const prodId = req.body.productId;

        userHelpers.addToWishlist(id, prodId, user).then((result) => {
            console.log(result, 'user.js');
            res.json(result)
        })
            .catch((error) => {
                console.log(error, "catch in user wish");
                res.json(error)
            })
    } catch (error) {
        console.log(error, 'no user');
        // res.json({error: "please login and try again"})
    }
})

router.delete('/wishlist/remove-item/:wid/:pid', (req, res) => {                                   //wid & pid is sent from ajax

    // console.log(`query${req.query},body${req.body}, param${req.params}` );

    try {
        const wishlistId = req.params.wid
        const prodId = req.params.pid

        userHelpers.removeWishlistItem(wishlistId, prodId).then((result) => {
            res.json(result)
        })
            .catch((error) => {
                res.json(error)
            })

    } catch (error) {
        console.log(error);
    }

})


// USER PROFILE ROUTES

router.get('/profile', verifyUser, async (req, res) => {
    const userId = req.session.user._id
    // const user1= req.session.user;
    try {

        let user1 = await userHelpers.fetchUserData(userId);
        res.render('user/user-profile', {
            user: true, user1,
            twilioError: req.session.otpError
        })
        req.session.otpError = false;

    } catch (error) {
        console.log(error);
    }
})


router.post('/verifyPhone', (req, res) => {

    let phone = "+91" + req.body.phone
    // console.log(phone);

    twilio.sendOtp(phone).then((result) => {

        res.render('user/otp', { user: true, phone, })

    }).catch((err) => {
        req.session.otpError = "Server not responding try again later"
        res.redirect('/profile')
    })


})

router.post('/otp', verifyUser, (req, res) => {

    const userId = req.session.user._id;
    const otp = req.body.otp.join('');         //otp from form was in array converted it into string
    const phone = req.body.phone;

    twilio.verifyOtp(otp, phone).then((result) => {

        userHelpers.verifyPhone(userId, phone).then(() => {

            res.redirect('/profile');
        })

    }).catch((err) => {

        req.session.otpError = err;
        res.redirect('/profile')
    })
})

router.post('/profile/image-upload', verifyUser, (req, res) => {
    try {

        if (req.files) {
            const userImage = req.files.userImage
            const id = req.session.user._id;

            userImage.mv('./public/images/user_images/' + id + ".jpg")
            res.redirect('/profile')
        } else {
            // req.session.imgError = 
            res.redirect('/profile')
        }

    } catch (error) {
        console.log(error);
    }

})

router.post('/profile/add-address', (req, res) => {
    try {

        console.log(req.body, 'profile');
        userHelpers.addAddress(req.body).then(() => {
            res.json({ status: true })

        })
    } catch (error) {
        console.log(error);
    }
})
router.post("/profile/update-name", (req, res) => {
    try {
        console.log(req.body);
        userHelpers.updateName(req.body).then((result) => {
            res.json({ status: true })
        })
    } catch (error) {
        console.log(error);
    }
})

router.get("/profile/remove-address", (req, res) => {
    console.log(req.query);
    try {

        userHelpers.removeAddress(req.query).then((result) => {
            res.json({ status: true })
        })
            .catch((err) => {
                console.log(`error ${err}`);
                res.json({ status: false })
            })

    } catch (error) {
        console.log(error, "remove-address");
    }
})

router.get("/change-password", (req, res) => {
    {

        res.render('user/change-password', { user: true, "error": req.session.changePasswordErr })
        req.session.changePasswordErr = false;

    }
})

router.get('/change-password/check-user', (req, res) => {
    try {
        // console.log(req.query,"get");

        userHelpers.checkEmail(req.query).then((result) => {
            res.json({ status: true })
        })
            .catch((err) => {
                res.json({ status: false })
            })
    } catch (error) {

    }
})
router.post("/change-password", (req, res) => {
    console.log(req.body);
    try {
        userHelpers.changePassword(req.body).then((result) => {

            res.redirect('/profile');

        }).catch((err) => {
            req.session.changePasswordErr = err;
            res.redirect('/change-password')
        })
    } catch (error) {

    }
})

router.get("/contactus", (req, res) => {
    res.render('user/contactus', { user: true, })
})


// ORDER PLACING  ORDER PLACEING

router.post('/place-order', verifyUser, async (req, res) => {
    try {
        console.log(req.body, 'valuoc');
        const couponCode = req.body.couponInput;                               // discount code from req.body
        var grandTotal = req.session.total.total;                              // total from session
        let discountData = null ;                                            
        const userId = req.session.user._id;                                    

        const user1 = await userHelpers.fetchUserData(userId);
        const userCart = await userHelpers.fetchCart(userId);
        if (couponCode) {
          await  userHelpers.checkCouponCode(couponCode, grandTotal).then(res => {
                discountData = res;
                discountData.couponCode = couponCode
            }) .catch(err => discountData = null)
        }

        console.log(`${userId}user`);

        res.render('user/place-order', { user: true, grandTotal, user1, userCart, discountData })

    } catch (error) {
        console.log(error, "try err fetching place order");
    }
})



router.post('/checkout',async (req, res) => {
    try {
console.log(req.body);
        const userId = req.session.user._id;
        const paymentMethod = req.body.paymentMethod;
        const couponCode = req.body.couponCode ;
        const  userCart = await userHelpers.fetchCart(userId);
        var cartTotal = req.session.total.total ;
        let discountData = null ;

        if (couponCode) {
            await  userHelpers.checkCouponCode(couponCode, cartTotal).then(res => {
                  discountData = res;
                  discountData.couponCode = couponCode
              }) .catch(err => discountData = null)
            }

        userHelpers.newOrder(req.body, userId,userCart,cartTotal,discountData)
        .then((result) =>{ 
            console.log(result);
            switch (paymentMethod) {
            case 'cod':
                res.json(result)
                break;

            case 'stripe': {
                let total = (discountData) ? discountData.total : cartTotal
                let orderId = result.orderId
                console.log('inside stripe,',result);
                userHelpers.stripeCheckOut(req.body, total, orderId).then(result => res.json(result)).catch(err => console.log(`err in user:${err}`))
                break;
            }
            case 'razorpay':
                console.log('razorpay');
                break;
            default:
                console.log('switch failed');
                break;
        }
            
            
            
            })
        .catch((error) => res.json(error))

        console.log(paymentMethod);                                                                                              //using switch just for a change
        

    } catch (error) {
        console.log(error, 'err');
    }
})





router.post('/hooks', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const endpointKey = process.env.ENDPOINT_SECRET_KEY
    const payload = req.body;
    const payloadString = JSON.stringify(payload);
    const header = stripe.webhooks.generateTestHeaderString({                                            //<= got from google
        payload: payloadString,
        secret: endpointKey,                                                              //sign in key from stripe CLI
    });

    let event;
    try {
        event = stripe.webhooks.constructEvent(payloadString, header,endpointKey);
        console.log(`webhooks events verifired:`, event.type);

    } catch (error) {
        console.log(`webhook error: ${error}`);
        return res.status(400).send(`Webhook Error: ${(err).message}`);
    }
    switch (event.type) {
        // case 'checkout.session.completed': {
        //     const session = event.data.object;

        //     console.log(session);

        //     // Check if the order is paid (for example, from a card payment)
        //     //
        //     // A delayed notification payment will have an `unpaid` status, as
        //     // you're still waiting for funds to be transferred from the customer's
        //     // account.
        //     if (session.payment_status === 'paid') {
        //         console.log('paymet success');
        //         //   let orderData =  req.session.orderData 
        //         // console.log(req.session.user);
        //         //   orderData.paymentMethod.transcationId = session.payment_intent
        //        let  checkoutId = session.id                //orderId
        //         // console.log(orderId);
        //         // req.session.checkoutId= checkoutId
                
        //         //  await userHelpers.newOrder(orderData, user).then(result=> console.log('result i user',result)).catch(err=> console.log(err))
        //     }

        //     break;
        // }

        case 'charge.succeeded': {
            const session = event.data.object;

            console.log(session, "chargesecc");
            if (session.paid) {
                let receipt = event.data.object.receipt_url;
                let orderId = session.metadata.orderId;
                let chargeId = session.id;
                // let checkoutId = s;
                console.log(`resipt => ${receipt} user =>  transcationId=> ${chargeId} `);  //send the recipt to the user 

                  userHelpers.updatePaymentStatus(orderId,receipt,chargeId).then(result=> console.log('result i user',result)).catch(err=> console.log(err))
            }

        }

        case 'checkout.session.async_payment_failed': {
            const session = event.data.object;
            console.log(session, 'payment failed')
            if(!session.paid){
                let orderId = session.metadata.orderId;
                let chargeId = session.id;
                userHelpers.stripeFail(orderId,chargeId).then(res=> console.log(res)).catch(err=> console.log(err))
            }

            break;
        }
    }
    res.json({ success: true });
})

router.get('/order-confirmation', (req, res) => {
    res.render('user/order-confirmation', { user: true })
})
router.get('/orders', verifyUser, async (req, res) => {
    const userId = req.session.user._id;
    const orders = await userHelpers.fetchOders(userId);
    // console.log(orders, 'insid orders')
    res.render('user/orders', { user: true, orders })
})
router.get("/view-order-details/:id", (req, res) => {
    let orderItems = 'asd'
})
module.exports = router;



function sort(sortBy, array) {
    return (sortBy === "price_asc") ? array.sort((a, b) => a.modelDetails.price - b.modelDetails.price)
        : (sortBy === "price_desc") ? array.sort((a, b) => b.modelDetails.price - a.modelDetails.price)
            : (sortBy === "new") ? array.reverse()
                : array
}

const { json } = require('body-parser');
const { Router } = require('express');
const express = require('express');
const router = express.Router();
const twilio = require('../config/twilio');
const userHelpers = require('../helpers/userHelpers');
require('dotenv').config
const verifyUser = (req, res, next) => {
    if (req.session.loggedIn) next()
    else res.redirect('/login')
}



router.get('/', async (req, res) => {
    let user1 = req.session.user;
    let cartCount = null;
    let wishlistCount = null;
    if (user1) {
        cartCount = await userHelpers.fetchCartCount(user1._id);
        wishlistCount = await userHelpers.fetchWishlistCount(user1._id)
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
    console.log(req.body);
    userHelpers.userLogin(req.body).then((result) => {
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


// router.get('/helmets',async (req,res)=>{

//     let helmetSection =await userHelpers.fetchHelmets()

//     res.render('user/helmets',{user:true, helmetSection})
// })

router.get('/category/:sub', async (req, res) => {
    try {
        let user1 = req.session.user;
        let cartCount = null;
        let wishlistCount = null;
        if (user1) {
            cartCount = await userHelpers.fetchCartCount(user1._id);

            wishlistCount = await userHelpers.fetchWishlistCount(user1._id);

        }
        let category = req.params.sub

        console.log(category);

        let product = await userHelpers.fetchCategory(category);

        res.render('user/category', { user: true, user1, category, cartCount, product, wishlistCount });

    } catch (error) {
        console.log(error,'error in loading category');
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

router.get('/sort', (req, res) => {
    console.log(req.query);
    console.log(req.query.sortType);

    userHelpers.sortProduct(req.query).then((result) => {
        console.log(result);
        res.json(result);

    })
})

router.get('/filter-size', async(req,res)=>{
try {
    console.log(req.query,'sort size');

    let    category =  req.query.category ;
    let filterSize = req.query.size ;
   console.log(filterSize);
         let products = await userHelpers.fetchCategory(category);
         products = products.filter(x=> x.modelDetails.size.some(y =>  y.size == filterSize  ))
    
         console.log(products,'products',category,'category ',filterSize,'value','last');
    
    res.render('user/filterSize',{user:true, products, category})
    
} catch (error) {
    console.log(error,"errrsort in");

}

})


// CART  ROUTES


router.get('/add-to-cart', (req, res) => {
    try {

        // console.log(req.query);
        let userId = req.session.user._id

        userHelpers.addToCart(req.query, userId).then(() => {
            res.json({ status: true })
        })
    } catch (error) {
        console.log(error);
    }

})

router.get('/cart', verifyUser, async (req, res) => {


    const userId = req.session.user._id;

    let cartItems = await userHelpers.fetchCart(userId);

    if (cartItems == null) var total = 0

    else total = await userHelpers.totalAmount(cartItems._id)

    // console.log(cartItems);
    console.log(total);
    res.render('user/cart', { user: true, cartItems, total })
})

router.post('/changeQuantity', (req, res) => {
    // console.log(req.body,'body');
    // console.log(req.query);
    userHelpers.changeCartQuantity(req.body).then(async (result) => {

        result.total = await userHelpers.totalAmount(req.body.cartId)
        console.log(result.total);
        res.json(result)
    })
})

router.get("/remove-cart-item/:cartId/:prodId", (req, res) => {
    console.log(req.params);

    userHelpers.removeCartItem(req.params).then((result) => {
        res.json(result)
    })

})

router.post('/cart/confirm-coupon', (req, res) => {

    let couponCode = req.body.code;
    let cartTotal = req.body.cartTotal;

    userHelpers.checkCouponCode(couponCode, cartTotal).then((result) => {
        console.log(result, 'res.json');
        res.json(result)
    })
        .catch((error) => {
            console.log(error);
            res.json(error)
        })
})

router.put('/cart/update-size', (req, res) => {
    console.log(`${req.body.cartId} body ${req.query.cartId} query ${req.params.cartId}`);
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
        console.log(error, 'err in try');
    }

})

router.get('/wishlist', async (req, res) => {
    try {
        let userId = req.session.user._id;
        let wishlistCount = await userHelpers.fetchWishlistCount(userId);
        let wishlist = await userHelpers.fetchWishlist(userId)

        res.render('user/wishlist', { user: true, wishlist, wishlistCount })

    } catch (error) {
        console.log(error);
    }
})

router.post('/add-to-wishlist', (req, res) => {
    console.log(req.body);
    try {
        const userId = req.session.user._id;
        const prodId = req.body.productId;
        userHelpers.addToWishlist(userId, prodId).then((result) => {
            console.log(result, 'user.js');
            res.json(result)
        })
            .catch((error) => {
                res.json(error)
            })
    } catch (error) {
        console.log(error);
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


// ORDER PLACING 

router.get('/place-order', async (req, res) => {
    try {
        const userId = req.session.user._id
        const grandTotal = req.query.total;
        const user1 = await userHelpers.fetchUserData(userId)
        const userCart = await userHelpers.fetchCart(userId)

        console.log(`${userId}user ${grandTotal} cart amount  ${user1} user  ${userCart} cart`);

        res.render('user/place-order', { user: true, grandTotal, user1, userCart })
    } catch (error) {
        console.log(error, "try err fetching place order");
    }




})

router.post('/place-order', (req, res) => {
    try {

        const userId = req.session.user._id;
        const paymentMethod = req.body.paymentMethod;
        console.log(paymentMethod);                                                           //using switch just for a change
        switch (paymentMethod) {
            case 'cod':
                userHelpers.newOrder(req.body, userId).then((result) => {
                    res.json(result)
                })
                    .catch((error) => {
                        console.error(error);
                        res.json(error)
                    })

                break;

            case 'stripe':
                console.log("stripe");
                break;

            case 'razorpay':
                console.log('razorpay');
                break;
            default:
                console.log('switch failed');
                break;
        }

    } catch (error) {

    }
})

router.get('/order-confirmation',(req,res)=>{
    res.render('user/order-confirmation',{user:true})
})
router.get('/orders', verifyUser, async (req,res)=>{
    const userId = req.session.user._id;
    const orders = await userHelpers.fetchOders(userId) ;
    console.log(orders,'insid orders')
    res.render('user/orders',{user:true,orders})
})
router.get("/view-order-details/:id",(req,res)=>{
    let orderItems = 'asd'
})
module.exports = router;
const express = require('express');
const router = express.Router();
const userHelper = require('../helpers/userHelpers');
const { route } = require('./admin');
const verifyUser = (req, res, next) => {
    if (req.session.loggedIn) next()
    else res.redirect('/login')
}



router.get('/', async (req, res) => {
    let user1 = req.session.user;
    let cartCount = null;
    if (user1) {
        cartCount = await userHelper.fetchCartCount(user1._id)
    }
    console.log(cartCount);
    res.render("user/landing-page", { user: true, cartCount, user1 });
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
    userHelper.userLogin(req.body).then((result) => {
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
    userHelper.userSignup(req.body).then((result) => {
        res.redirect('/login')
    })
        .catch((err) => {
            req.session.Error = err;
            res.redirect('/signup')
        })

})


// router.get('/helmets',async (req,res)=>{

//     let helmetSection =await userHelper.fetchHelmets()

//     res.render('user/helmets',{user:true, helmetSection})
// })

router.get('/category/:sub', async (req, res) => {
    try {
         let user1 = req.session.user;
         let cartCount = null;
         if (user1) {
             cartCount = await userHelper.fetchCartCount(user1._id)
         }
         let category = req.params.sub

        console.log(category);

        let product = await userHelper.fetchCategory(category);

        res.render('user/category', { user: true,user1, category,cartCount, product });

        // res.json({result:true})
        // if(subcategory == 'racing')          res.render('user/helmet-racing',{user:true, helmetSubcategory });
        // else if(subcategory == 'sport')      res.render('user/helmet-sport',{user:true,  helmetSubcategory });
        // else if(subcategory == 'touring')    res.render('user/helmet-touring',{user:true, helmetSubcategory });
        // else if(subcategory == 'off-road')   res.render('user/helmet-off-road',{user:true, helmetSubcategory });

    } catch (error) {
        console.log(error);
    }

})

// router.get('/accessories', async (req,res)=>{

//     let accessories = await userHelper.fetchAccessories()

//     res.render('user/accessories',{user:true, accessories})
// })

// router.get('/accessories/:sub',async (req,res)=>{
//     try {
//             let subcategory = req.params.sub
//             let accessoriesSub = await userHelper.fetchSub(subcategory);


//             if(subcategory == 'visors')               res.render('user/accessories-visors',{user:true, accessoriesSub});
//             else if (subcategory == 'communications')  res.render('user/accessories-communication',{user:true, accessoriesSub});
//             else if (subcategory == 'pads')            res.render('user/accessories-interiors',{user:true,accessoriesSub }) 

//     } catch (error) {
//         console.log(error);
//     }
// })
router.get('/view-product/:id', async (req, res) => {
    let id = req.params.id
    let product = await userHelper.fetchProduct(id);
    console.log(product);
    res.render('user/view-product', { user: true, product })
})

router.get('/sort', (req, res) => {
    console.log(req.query);
    console.log(req.query.sortType);

    userHelper.sortProduct(req.query).then((result) => {
        console.log(result);
        res.json(result);

    })
})

router.get('/add-to-cart', (req, res) => {
    try {
        let prodId = req.query.id;
        let prodName = req.query.name;
        let prodSubcategory = req.query.subCategory;
        let prodCategory = req.query.category;
        let prodPrice = req.query.price;
        let prodsize = req.query.size
        // console.log(req.query);
        let userId = req.session.user._id
        console.log(prodsize,'size');

        userHelper.addToCart(req.query, userId).then(() => {
            res.json({ status: true })
        })
    } catch (error) {
        console.log(error);
    }

})

router.get('/cart', async (req, res) => {
    try {

        const userId = req.session.user._id;

        let cartItems = await userHelper.fetchCart(userId);

        let total = await userHelper.totalAmount(cartItems._id)

        // console.log(cartItems);
        console.log(total);
        res.render('user/cart', { user: true, cartItems,total })

    }
    catch (error) {
        res.status(500, "opps something went wrong")
    }
})

router.post('/changeQuantity',(req,res)=>{
    // console.log(req.body,'body');
    // console.log(req.query);
    userHelper.changeCartQuantity(req.body).then( async (result)=>{

         result.total = await userHelper.totalAmount(req.body.cartId)
         console.log(result.total);
        res.json(result)
    })
})

router.get("/remove-cart-item/:cartId/:prodId",(req,res)=>{
console.log(req.params);

    userHelper.removeCartItem( req.params).then((result)=>{
        res.json(result)
    })

})

router.get('/profile',verifyUser, async (req,res)=>{
    const userId = req.session.user._id 
    // const user1= req.session.user;
    try {
        
     let user1 = await userHelper.fetchUserData(userId);
     res.render('user/user-profile',{user:true,user1})
        
    } catch (error) {
        console.log(error);
    }
})

router.post('/profile',(req,res)=>{
    
    console.log(req.body);

})

module.exports = router;
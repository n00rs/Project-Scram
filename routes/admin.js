const express = require('express');
const router = express.Router();
const adminHelpers = require('../helpers/adminHelpers')
const verifyAdmin = (req, res, next) => {
    if (req.session.adminIn) next()
    else res.redirect('/admin/login')
}

/*getting  admin routes */

router.get('/', verifyAdmin,async (req, res) => {
    try {
        let admin = req.session.admin ;
        // let OrderCount = null ;
        let userCount = await adminHelpers.userCount()
        let prodCount = await adminHelpers.productCount()
        prodCount = prodCount ? prodCount[0] :0
        let totalSales = await adminHelpers.salesDetails()
        // console.log(totalRevenue);
        // totalRevenue = totalRevenue ? totalRevenue[0] : 0 


        res.render('admin/admin-dash', { admin, prodCount, userCount, totalSales})      
    } catch (error) {
        console.log(error);
    }
  
})

router.get('/login', (req, res) => {
    if (req.session.adminIn) {
        res.redirect('/admin')
    } else {
        res.render('admin/admin-login', { idError: req.session.idError });
        req.session.idError = false;
    }


})

// router.post('/add-admin', (req, res) => {

//     adminHelpers.add_admin(req.body).then(() => {
//         res.redirect('/admin');
//     })
//         .catch((err) => {
//             req.session.idError = err;
//             res.redirect('/admin/add-admin')
//         })
// })

router.post('/login', (req, res) => {

    adminHelpers.adminVerify(req.body).then((data) => {
        console.log(data);
        if (data.status) {

            req.session.adminIn = true;

            req.session.admin = data.admin

            res.redirect('/admin')
        }
    }).catch((err) => {

        req.session.idError = err;
        res.redirect('/admin')
    })
})

router.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/admin')
})
//   USER MANAGEMENT FROM ADMIN SIDE

router.get('/view-users', verifyAdmin, async (req, res) => {

    let users = await adminHelpers.fetchAllUsers()
    console.log(users);
    res.render('admin/view-users', { admin: true, users });
})

router.get('/blockUser', (req, res) => {
    console.log(req.query.id);
    adminHelpers.blockUser(req.query.id).then(() => {
        res.json(true)
    })
})

router.get('/removeUser', (req, res) => {
    // console.log(req.query.id);
    adminHelpers.removeUser(req.query.id).then((result) => {

        res.json(result)
    })
})

router.get('/updateUserData', async (req, res) => {
    // console.log(req.query.id);
    let user = await adminHelpers.fetchUser(req.query.id);
    // console.log(user, "afterfetch");
    res.render('admin/edit-user', { user })
})

router.post('/updateUserData', (req, res) => {
    console.log(req.body);
    adminHelpers.updateUserData(req.body).then(() => {
        res.redirect('/admin/view-users')
    })
})


router.get('/user-orders',(req,res)=>{
    try {
        let userId = req.query.id
        adminHelpers.fetchUserOrders(userId).then((orders)=>{
console.log(orders)
            res.render('admin/user-orders',{admin:true,orders })
        }).catch(err=>console.log(err))

    } catch (error) {
        console.log(error)
    }
})

//   ADDING PRODUCTS 

router.get('/add-products', verifyAdmin, (req, res) => {
    res.render('admin/add-products', { admin: true, })
})

router.post('/add-products', (req, res) => {
    try {

        adminHelpers.addProduct(req.body).then((result) => {
            if (req.files) {
                let img1 = req.files.image1;
                let img2 = req.files.image2;
                let img3 = req.files.image3;
                let img4 = req.files.image4;

                console.log(img1, img2, img3, img4);

                if (img1) img1.mv('./public/images/product_images/' + result + '_1.jpg');
                if (img2) img2.mv('./public/images/product_images/' + result + '_2.jpg');
                if (img3) img3.mv('./public/images/product_images/' + result + '_3.jpg');
                if (img4) img4.mv('./public/images/product_images/' + result + '_4.jpg');
            }
            res.redirect('/admin/view-products')
        })
    } catch (error) {
        console.log(error, 'image error');
    }
})


router.get('/view-products', verifyAdmin, async (req, res) => {
try {
    let products = await adminHelpers.fetchAllProducts();

    res.render('admin/view-products', { admin: true, products })
   
} catch (error) {
res.status(500).json(error.message)    
}
 })

router.get('/edit-product/:id', verifyAdmin, async (req, res) => {
try {
    let product = await adminHelpers.fetchProduct(req.params.id)
    res.render('admin/edit-product', { admin: true, product })   
} catch (error) {
    res.status(500).json(error.message)
}
})

router.post('/edit-product', (req, res) => {
    try {
        // console.log(req.body);
        adminHelpers.editProduct(req.body).then((result) => {

            if (req.files) {

                let id = req.body.productId;
                let img1 = req.files.image1;
                let img2 = req.files.image2;
                let img3 = req.files.image4;
                let img4 = req.files.image4;

                if (img1) img1.mv('./public/images/product_images/' + id + '_1.jpg');
                if (img2) img2.mv('./public/images/product_images/' + id + '_2.jpg');
                if (img3) img3.mv('./public/images/product_images/' + id + '_3.jpg');
                if (img4) img4.mv('./public/images/product_images/' + id + '_4.jpg');
            }
            res.redirect('/admin/view-products')
        })
    } catch (error) {
        console.log(error, "post edit error");
        res.status({ error: error })
    }
})

router.delete('/deleteProduct', (req, res) => {
    console.log(req.body.id);
    adminHelpers.deleteProduct(req.body.id)
    .then(result=> res.json(result))
    .catch(err=> res.json(err))
})

router.get('/add-banners', (req, res) => {
    res.render('admin/add-banners')
})

router.post('/add-banners', (req, res) => {
    try {
        // console.log(req.files);
        let helmetBanner = req.files.helmet;
        // console.log(helmetBanner);
        let accessoriesBanner = req.files.accessories;
        let racingBanner = req.files.racing;
        let sportBanner = req.files.sport;
        let touringBanner = req.files.touring;
        let offRoadBanner = req.files.offRoad;
        let visorsBanners = req.files.visors;
        let communicationsBanner = req.files.communications;
        let padsBanner = req.files.pads;
        let othersBanner = req.files.others;

        if (helmetBanner) helmetBanner.mv('./public/images/banners/helmet.jpg')
        if (accessoriesBanner) accessoriesBanner.mv('./public/images/banners/accessories.jpg')
        if (racingBanner) racingBanner.mv('./public/images/banners/racing.jpg')
        if (sportBanner) sportBanner.mv('./public/images/banners/sport.jpg')
        if (touringBanner) touringBanner.mv('./public/images/banners/touring.jpg')
        if (offRoadBanner) offRoadBanner.mv('./public/images/banners/off-road.jpg')
        if (visorsBanners) visorsBanners.mv('./public/images/banners/visors.jpg')
        if (communicationsBanner) communicationsBanner.mv('./public/images/banners/communications.jpg')
        if (padsBanner) padsBanner.mv('./public/images/banners/pads.jpg')
        if (othersBanner) othersBanner.mv('./public/images/banners/others.jpg')

        res.redirect('/admin/add-banners')

    } catch (error) {
        console.log(error);
    }
})

router.get('/manage-coupons', async (req, res) => {

    let coupons = await adminHelpers.fetchCoupons()
    res.render("admin/manage-coupons", { admin: true, coupons })
})

router.post('/manage-coupons', (req, res) => {

    console.log(req.body);
    adminHelpers.addCoupon(req.body).then((result) => {
        console.log(result);
        res.json(result);
    })
        .catch((error) => {
            console.log(error, "ctcherr in ");
            res.json(error);
        })
})

//ORDERS   

router.get('/all-orders', async (req, res) => {
    try {
        let orders = await adminHelpers.fetchAllOrders();
        res.render('admin/all-orders', { admin: true, orders });
    } catch (error) {

    }
})

router.get('/all-orders/:orderId', (req, res) => {
    try {

        let orderId = req.params.orderId
        adminHelpers.fetchOrderDetails(orderId).then((orderDetails) => {
            // const orderDetails = result.orderData
            res.render('admin/order-details', { admin: true, orderDetails })
        })

    } catch (error) {
        console.log(error, " err in catch ordetails");
    }
})

router.patch('/all-orders', (req, res) => {
    try {
        console.log(req.body);

        adminHelpers.checkStock(req.body).then(result => res.json(result)).catch(error => res.json(error))
    } catch (error) {
        console.log(error, "error in patch");
    }
})
router.put('/all-orders', (req, res) => {
    try {
        console.log(req.body);
        adminHelpers.updateOrderStatus(req.body)
        .then(result => res.json(result))
        .catch(error => res.json(error))
    } catch (error) {
        console.log(error, 'status update');
    }
})

module.exports = router;

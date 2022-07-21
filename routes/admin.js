const { Router } = require('express');
const express = require('express');
const router = express.Router();
const adminHelpers = require('../helpers/adminHelpers')
const verifyAdmin = (req,res,next) =>{
    if(req.session.adminIn) next()
else res.redirect('/admin/login')
}

/*getting  admin routes */
router.get('/', verifyAdmin,(req,res)=>{
    let admin = req.session.admin
    res.render('admin/admin-dash',{admin} )
})

router.get('/login',(req,res) => {
    if(req.session.adminIn){
        res.redirect('/admin')
    }else{
        res.render('admin/admin-login',{ idError :req.session.idError});
        req.session.idError = false;
    }

   
})

router.get('/add-admin', (req, res) => {

    res.render('admin/add-admin',{admin:true,idError:req.session.idError});
    req.session.idError =false ;
})
router.post('/add-admin', (req,res)=>{

adminHelpers.add_admin(req.body).then(()=>{

res.redirect('/admin');

})
.catch((err)=>{
   req.session.idError = err ;
   res.redirect('/admin/add-admin')
}) 
})

router.post('/login',(req,res)=>{
    
    adminHelpers.adminVerify(req.body).then((data)=>{
        console.log(data);
if(data.status){

    req.session.adminIn = true;

    req.session.admin = data.admin

    res.redirect('/admin')
}
    }).catch((err)=>{
        
        req.session.idError = err;
        res.redirect('/admin')
    })
})

//   USER MANAGEMENT FROM ADMIN SIDE

router.get('/view-users',verifyAdmin,async (req,res)=>{

   let users=  await adminHelpers.fetchAllUsers()
console.log(users);
    res.render('admin/view-users',{admin:true,users});
})

router.get('/blockUser',(req,res)=>{
    console.log(req.query.id);
    adminHelpers.blockUser(req.query.id).then(()=>{
        res.json(true)
    })
})

router.get('/removeUser',(req,res)=>{
    console.log(req.query.id);
    adminHelpers.removeUser(req.query.id).then((result)=>{
        
        res.json(result)
    })
})

router.get('/updateUserData',async (req,res)=>{
    console.log(req.query.id);
    let user = await adminHelpers.fetchUser(req.query.id);
    console.log(user,"afterfetch");
    res.render('admin/edit-user',{user})
})

router.post('/updateUserData',(req,res)=>{
    console.log(req.body);
    adminHelpers.updateUserData(req.body).then(()=>{
        res.redirect('/admin/view-users')
    })
})

//   ADDING PRODUCTS 

router.get('/add-products',(req,res)=>{
    res.render('admin/add-products',{admin:true,})
})

router.post('/add-products',(req,res)=>{
    

   let img1 = req.files.image1 ;
   let img2 = req.files.image2 ;
   let img3 = req.files.image3 ;
   let img4 = req.files.image4 ;

   console.log(img1,img2,img3,img4);
    console.log(req.body);
    adminHelpers.addProduct(req.body).then((result)=>{

        img1.mv('./public/images/product_images/'+result+'_1.jpg') ;
        img2.mv('./public/images/product_images/'+result+'_2.jpg') ;
        img3.mv('./public/images/product_images/'+result+'_3.jpg') ;
        img4.mv('./public/images/product_images/'+result+'_4.jpg') ;

        res.redirect('/admin/view-products')
    })
})

router.get('/view-products',(req,res)=>{
    res.render('admin/view-products')
})






module.exports = router;

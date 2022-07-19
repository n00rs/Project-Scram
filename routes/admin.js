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
        console.log(err);
        req.session.idError = err;
        res.redirect('/admin')
    })
})

router.get('/view-users',verifyAdmin,(req,res)=>{
    res.render('admin/view-users',{admin:true});
})


module.exports = router;

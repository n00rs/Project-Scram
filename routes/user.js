const express = require('express') ;
const router = express.Router() ;
const userHelper = require('../helpers/userHelpers');
const verifyUser = (req,res,next) =>{
    if(req.session.loggedIn) next()
    else res.redirect('/login')
}



router.get('/', (req, res) => {
     let user = req.session.user;
     console.log(user);
res.render("user/landing-page",{user});
})


// user -- login

router.get('/login',(req,res)=>{
    if(req.session.loggedIn) res.redirect('/')

    else {

    res.render('user/login',{idError: req.session.idError}) ;
    req.session.idError = false;
}
})

router.post('/login',(req,res)=>{
    console.log(req.body);
    userHelper.userLogin(req.body).then((result) => {
    if(result.status){
        req.session.loggedIn = true;
        req.session.user = result.user;
        res.redirect('/')
    }
    })
    .catch((err)=>{
        req.session.idError = err;
        res.redirect('/login')
})
})

router.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/')
})

// user--signup

router.get('/signup',(req,res)=>{

    res.render('user/signup',{user:true, idError:req.session.Error});
    req.session.Error=false;

})


router.post('/signup',(req,res)=>{
    console.log(req.body);
    userHelper.userSignup(req.body).then((result)=>{
        res.redirect('/login')
    })
    .catch((err)=>{
        req.session.Error = err;
        res.redirect('/signup')
    })

})



module.exports = router;
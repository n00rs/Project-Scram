const express = require('express') ;
const router = express.Router() ;
const userHelper = require('../helpers/userHelpers');
const { route } = require('./admin');
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


router.get('/helmets',async (req,res)=>{

    let helmetSection =await userHelper.fetchHelmets()

    res.render('user/helmets',{user:true, helmetSection})
})

router.get('/helmets/:sub',async(req,res)=>{
    try {
        let subcategory=req.params.sub
        let helmetSubcategory = await userHelper.fetchSub(subcategory);
    
        if(subcategory == 'racing')          res.render('user/helmet-racing',{user:true, helmetSubcategory });
        else if(subcategory == 'sport')      res.render('user/helmet-sport',{user:true,  helmetSubcategory });
        else if(subcategory == 'touring')    res.render('user/helmet-touring',{user:true, helmetSubcategory });
        else if(subcategory == 'off-road')   res.render('user/helmet-off-road',{user:true, helmetSubcategory });
        
    } catch (error) {
        console.log(error);
    }

})

router.get('/accessories', async (req,res)=>{
    
    let accessories = await userHelper.fetchAccessories()

    res.render('user/accessories',{user:true, accessories})
})

router.get('/accessories/:sub',async (req,res)=>{
    try {
            let subcategory = req.params.sub
            let accessoriesSub = await userHelper.fetchSub(subcategory);
            
        
            if(subcategory == 'visors')               res.render('user/accessories-visors',{user:true, accessoriesSub});
            else if (subcategory == 'communications')  res.render('user/accessories-communication',{user:true, accessoriesSub});
            else if (subcategory == 'pads')            res.render('user/accessories-interiors',{user:true,accessoriesSub }) 
        
    } catch (error) {
        console.log(error);
    }

    
})
module.exports = router;
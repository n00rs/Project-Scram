const handlebars = require('hbs');
const { NetworkContext } = require('twilio/lib/rest/supersim/v1/network');
module.exports = {                                   //
 
    count: (index)=>{

       return index+1 ;
    },

dateFormat: (date)=>{
   return date.toLocaleDateString()
},

choosenSize: (selectedSize)=>{
   if(selectedSize =="") return "select"
   else return  selectedSize
},

checkPhone: (phoneVerify)=>{
   if(phoneVerify == true) return next()
   else {
      return "phone not verifies ", location.href='/profile'
   }
},
JSON: (obj)=>{
   return JSON.stringify(obj)
},

orderData : (user,userCart,grandTotal)=>{
   let orderData={
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      order: userCart.products,
      amount: grandTotal
   }
   return JSON.stringify(orderData)
}

}
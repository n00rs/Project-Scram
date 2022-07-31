
module.exports = {                                   //

   count: (index) => {

      return index + 1;
   },

   dateFormat: (date) => {
      return date.toLocaleDateString()
   },

   choosenSize: (selectedSize) => {
      if (selectedSize == "") return "select"
      else return selectedSize
   },

   checkPhone: (phoneVerify) => {
      if (phoneVerify == true) return next()
      else {
         return "phone not verifies ", location.href = '/profile'
      }
   },
   orderAddress: (address, user) => {
      address.name = user.firstName + " " + user.lastName;
      address.phone = user.phone;
      address.email = user.email;


      // console.log(address, 'addressinhbs after',);
      return JSON.stringify(address)
   },

   orderData: (userCart, grandTotal) => {
      let orderData = {
         order: userCart.products,
         amount: grandTotal
      }
      
      return JSON.stringify(orderData)
   },

   expandAddress : (address)=>{
    let  deliveryAddress = address.name +" "+ address.building_name +" \n" +address.street+" "+address.city + " \n" + address.country+" "
   +address.pincode + " \n"  +address.phone + " "+address.email+ " " ;
   return deliveryAddress
   console.log(deliveryAddress);
   }

}

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

   expandAddress: (address) => {
      let deliveryAddress = address.name + " " + address.building_name + " \n" + address.street + " " + address.city + " \n" + address.country + " "
         + address.pincode + " \n" + address.phone + " " + address.email + " ";
      return deliveryAddress
      // console.log(deliveryAddress);
   },
   sizeToggle: (category) => {
      console.log(category);
      if (category == 'accessories' || category == 'visors' || category == 'communications' || category == 'pads' || category == 'others') return "display:none ;"


   },

   editPage: (val) => {
      console.log(val);
   },
   check: (value1, value2) => {
      return (value1 === value2) ? "checked" : "notchecked"
   },

   checkSort: (value1, value2) => {

      return (value1 === value2) ? "selected" : "notselected"
   },

   //ORDER-DETAILS.HBS FUNCTIONS ADMIN SIDE

   displayOrdrBtn: (value1, value2) => { return (value1 === value2) ? "" : "display:none ;" },

   confirmBtn: (orderStatus) => { return (orderStatus == undefined) ? " " : "display:none ;" },                                      //

   dispatchBtn: (orderStatus) => { return orderStatus == "confirmed" ? " " : "display:none ;" },

   deliveredBtn: (orderStatus) => { return orderStatus == "shipped" ? " " : "display:none ;" },

   //ALL-ORDERS USER SIDE FUNCTION

   checkOrderStatus: (orderStatus) => {
      console.log(orderStatus, "orderStatus");
      return orderStatus === 'confirmed' ? '33%' :
             orderStatus === 'shipped' ? '66%' :
             orderStatus === 'delivered' ? '100%' : '0%'
             
   },

   cancelStatus: (orderStatus) => {
      return (orderStatus == null || orderStatus === 'confirmed') ? "" : "display:none ;"
      // orderStatus === 'delivered' ? 
   },
   orderDate: (date) => { date = date.split(','); return date[0] },

   checkDiscountValue: (discount) => {
      return (discount) ? discount : 0
   },

   checkDiscountCode: (couponCode) => {
      return (couponCode) ? couponCode.toUpperCase() : "NOCODE"
   }


}
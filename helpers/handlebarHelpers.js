const handlebars = require('hbs')
module.exports = {                                   //
 
    count: (index)=>{

       return index+1 ;
    },
dateFormat: (date)=>{
   return date.toLocaleDateString()
},

}
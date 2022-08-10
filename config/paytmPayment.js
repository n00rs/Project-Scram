require('dotenv').config()
const https = require('https') ;
const paytmCheckSum = require('./PaytmChecksum') ;
const querytring = require('querystring') ;
const merchantId = process.env.PAYTM_MERCHANT_ID;
const merchantKey = process.env.PAYTM_MERCHANT_KEY;
const paytmWebsite = process.env.PAYTM_WEBSITE;

module.exports = {
    paytmPayments: (userData, total, orderid) =>{

        console.log(userData, total, orderid, "inside paytm funtion");
        const address = JSON.parse(userData.address);
        const orderId = orderid.toString();
        const amount = total;
        const phone = address.phone ;

        let paytmParams = {};                                                                                       //setting data according to paytm intgeration docs  
        paytmParams['MID'] = merchantId,
            paytmParams['WEBSITE'] = paytmWebsite,
            paytmParams['ORDER_ID'] = orderId,                                                                         //orderId for each payment request should be unique
            paytmParams['CUST_ID'] = address._id,
            paytmParams['TXN_AMOUNT'] = amount.toString(),
            paytmParams['CALLBACK_URL'] = `${process.env.HOSTED_URL}/paytm_status`,                                        //callback url for fetching transcation url
            paytmParams['EMAIL'] = address.email,
            paytmParams['MOBILE_NO'] = phone

        console.log(paytmParams) ; 
        return new Promise((resolve, reject) => {
            
        paytmCheckSum.generateSignature(paytmParams, merchantKey).then((checksum) => {                             //creating checksum 
            console.log(checksum, 'after generate');
            paytmParams = {
                ...paytmParams,
                "CHECKSUMHASH": checksum
            };
            
           resolve({paytm: paytmParams})                                                                       //sending it into the ajax
        }).catch(err => {console.log(err); reject ({}) })
        })
        








    },
    callback : (req,res)=>{
        console.log(req.body)
    }
}
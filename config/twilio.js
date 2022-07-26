require('dotenv').config()
const accountsid = process.env.TWILIO_ACCOUNTSID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;

const client = require('twilio')(accountsid, authToken)

module.exports = {

    sendOtp: (data)=>{

        // console.log('otp',data);

        return new Promise((resolve, reject) => {
            client.verify.v2.services(serviceId).verifications
            .create({
                to: data,
                channel: 'sms'
            }).then((result)=>{
                // console.log(result);
                resolve(result)

            }).catch((err)=>{

                reject(err)
                
                console.log(err,"otperr");
            })
        })
    },

    verifyOtp: (otp,phone)=>{
        console.log(otp,phone,'verify');

        return new Promise((resolve, reject) => {
            let otpError = "invalid otp "
            client.verify.services(serviceId).verificationChecks
            .create({
                to: phone,
                code: otp,
            }).then((result)=>{
                if(result.valid)  
                resolve()
                else
                reject(otpError)
                // console.log(result,'result');

            }).catch((err)=>{
                console.log(err,'err!@#');

            })
        }) 
    }
}
require('dotenv').config()
const accountsid = process.env.TWILIO_ACCOUNTSID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;

const client = require('twilio')(accountsid, authToken)

module.exports = {

    sendOtp: (data) => {

        return new Promise((resolve, reject) => {
            client.verify.v2.services(serviceId).verifications
                .create({
                    to: data,
                    channel: 'sms'
                }).then(result => resolve(result))
                .catch(err => reject(err))
        })
    },

    verifyOtp: (otp, phone) => {
        return new Promise((resolve, reject) => {
            let otpError = "invalid otp ";
            client.verify.services(serviceId).verificationChecks
                .create({
                    to: phone,
                    code: otp,
                })
                .then(result => (result.valid) ? resolve() : reject(otpError))
                .catch(err => reject(err))
        })
    }
}
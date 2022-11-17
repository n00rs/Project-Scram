require("dotenv").config();
const https = require("https");
const paytmCheckSum = require("./PaytmChecksum");
const querytring = require("querystring");
const userHelpers = require("../helpers/userHelpers");
const merchantId = process.env.PAYTM_MERCHANT_ID;
const merchantKey = process.env.PAYTM_MERCHANT_KEY;
const paytmWebsite = process.env.PAYTM_WEBSITE;

module.exports = {
  paytmPayments: (userData, total, orderid) => {
    console.log(userData, total, orderid, "inside paytm funtion");
    const address = JSON.parse(userData.address);
    const orderId = orderid.toString();
    const amount = total;
    const phone = address.phone;

    let paytmParams = {};
    //setting data according to paytm intgeration docs
    (paytmParams["MID"] = merchantId),
      (paytmParams["WEBSITE"] = paytmWebsite),
      (paytmParams["ORDER_ID"] = orderId), //orderId for each payment request should be unique
      (paytmParams["TXN_AMOUNT"] = amount.toString()),
      (paytmParams["CALLBACK_URL"] = `${process.env.HOSTED_URL}/paytm-status`), //callback url for fetching transcation url
      (paytmParams["CUST_ID"] = address._id),
      // paytmParams['NAME'] = address.name,
      (paytmParams["EMAIL"] = address.email),
      (paytmParams["MOBILE_NO"] = phone);

    console.log(paytmParams);
    return new Promise((resolve, reject) => {
      paytmCheckSum
        .generateSignature(paytmParams, merchantKey)
        .then((checksum) => {
          //creating checksum
          console.log(checksum, "after generate");
          paytmParams = {
            ...paytmParams,
            CHECKSUMHASH: checksum,
          };

          resolve({ paytm: paytmParams }); //sending it into the ajax
        })
        .catch((err) => reject({ err: err.message }));
    });
  },

  callback: (req, res) => {
    try {
      let body = querytring.parse(req.body);
      body = JSON.parse(JSON.stringify(req.body)); //idk only this is working

      let checkSumHash = req.body.CHECKSUMHASH; //saving the checksumhash returned from paytm after txn initiated
      delete req.body.CHECKSUMHASH;

      let verifyCheckSum = paytmCheckSum.verifySignature(body, merchantKey, checkSumHash); //passing the data from TXN ,with our Mkey & checksum returned from TXN
      // console.log(verifyCheckSum);
      if (!verifyCheckSum) {
        let error = "failed to verify the transcation ";
        res.redirect(`/order-confirmation/${error}`);
      } else {
        var paytmParams = {};
        paytmParams["MID"] = merchantId;
        paytmParams["ORDER_ID"] = body.ORDERID;
        paytmCheckSum.generateSignature(paytmParams, merchantKey).then((checkSumHash) => {
          paytmParams["CHECKSUMHASH"] = checkSumHash;
          // console.log(paytmParams);
          let postData = JSON.stringify(paytmParams);

          let options = {
            //setting headers
            hostname: "securegw-stage.paytm.in", //in test mod
            //     hostname: 'securegw.paytm.in',                                                            in Production
            port: 443,
            path: "/order/status",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": postData.length, //from paytm integration docs
            },
          };

          let result = "";
          let postReq = https.request(options, (response) => {
            response.on("data", (chunk) => (result += chunk));

            response.on("end", async () => {
              const paymentData = JSON.parse(result);
              console.log(paymentData);
              if (paymentData.STATUS === "TXN_SUCCESS") {
                console.log("payment success");
                let orderId = paymentData.ORDERID;
                let status = paymentData.STATUS; // or  paymentData.STATUS
                let txnId = paymentData.TXNID;

                await userHelpers
                  .updatePaymentStatus(orderId, txnId, status)
                  .then(() => res.redirect(`/order-confirmation/success`))
                  .catch((err) => res.redirect(`/order-confirmation/${err}`));
              } else {
                console.log("payment failed");
                let orderId = paymentData.ORDERID;
                let status = paymentData.STATUS; // or  paymentData.STATUS
                let txnId = paymentData.TXNID;

                await userHelpers
                  .updatePaymentStatus(orderId, txnId, status)
                  .then(() => res.redirect(`/order-confirmation/${paymentData.RESPMSG}`))
                  .catch((err) => res.redirect(`/order-confirmation/${err}`));
              }
            });
          });
          postReq.write(postData);
          // postReq.end();
        });
      }
    } catch (err) {
      console.log(error, "error in paytm callback");
      res.redirect(`/order-confirmation/${err}`);
    }
  },
};

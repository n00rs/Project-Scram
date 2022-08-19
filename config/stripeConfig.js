require('dotenv').config()
const userHelpers = require('../helpers/userHelpers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY) 
 

module.exports = {
    stripeCheckOut: (data, total, orderId) => {

        const address = JSON.parse(data.address) ;
        const amount = parseInt(total * 100) ;
        const orderid = orderId.toString() ;
        // console.log("stricheck out",)

        return new Promise(async (resolve, reject) => {

            const customer = await stripe.customers.create({
                address: {
                    city: address.city,
                    line1: address.building_name,
                    line2: address.street,
                    postal_code: address.pincode,
                },
                email: address.email,
                name: address.name,
                phone: address.phone,
                shipping: {
                    address: {
                        city: address.city,
                        line1: address.building_name,
                        line2: address.street,
                        postal_code: address.pincode,

                    },
                    name: address.name,
                    phone: address.phone,
                },
                metadata: {
                    orderId: orderid,
                }
            })
            const session = await stripe.checkout.sessions.create({
                success_url: `${process.env.HOSTED_URL}/order-confirmation/success`,
                cancel_url: `${process.env.HOSTED_URL}/order-confirmation/failed`,
                mode: `payment`,
                payment_method_types: [`card`],
                client_reference_id: orderid,
                customer: customer.id,
                line_items: [{
                    price_data: {
                        currency: 'inr',
                        unit_amount: amount,
                        product_data: {
                            name: "grand total",
                        },
                    },
                    quantity: 1,
                }],
                payment_intent_data: {
                    receipt_email: address.email,
                    metadata: {
                        orderId: orderid
                    },
                },

            })
            // console.log(session);
            session.url ? resolve({ url: session.url }) : reject({ err: "stripe out of station" })
        })
    },

    stripeWebhook: async (req, res) => {
        try {
        const endpointKey = process.env.ENDPOINT_SECRET_KEY
        const payload = req.body;
        const payloadString = JSON.stringify(payload);
        const header = stripe.webhooks.generateTestHeaderString({                                            //<= got from google
            payload: payloadString,
            secret: endpointKey,                                                                           //sign in key from stripe CLI
        });
    
        let event;
        try {
            event = stripe.webhooks.constructEvent(payloadString, header,endpointKey);
            console.log(`webhooks events verifired:`, event.type);
    
        } catch (error) {
            console.log(`webhook error: ${error}`);
            return res.status(400).send(`Webhook Error: ${(err).message}`);
        }
        switch (event.type) {
            // case 'checkout.session.completed': {
            //     const session = event.data.object;
    
            //     console.log(session);
    
            //     // Check if the order is paid (for example, from a card payment)
            //     //
            //     // A delayed notification payment will have an `unpaid` status, as
            //     // you're still waiting for funds to be transferred from the customer's
            //     // account.
            //     if (session.payment_status === 'paid') {
            //         console.log('paymet success');
            //         //   let orderData =  req.session.orderData 
            //         // console.log(req.session.user);
            //         //   orderData.paymentMethod.transcationId = session.payment_intent
            //        let  checkoutId = session.id                //orderId
            //         // console.log(orderId);
            //         // req.session.checkoutId= checkoutId
                    
            //         //  await userHelpers.newOrder(orderData, user).then(result=> console.log('result i user',result)).catch(err=> console.log(err))
            //     }
    
            //     break;
            // }
    
            case 'charge.succeeded': {
                const session = event.data.object;
    
                console.log(session, "chargesecc");
                if (session.paid) {
                    let receipt = event.data.object.receipt_url;
                    let orderId = session.metadata.orderId;
                    let chargeId = session.id;
                    let status = "TXN_SUCCESS"
                    console.log(`receipt => ${receipt} user =>  transcationId=> ${chargeId} `);  //send the recipt to the user 
    
                      userHelpers.updatePaymentStatus(orderId, chargeId, status, receipt)
                      .then(result=> console.log('result i user',result))
                      .catch(err=> console.log(err)) 
                }
    
            }
    
            case 'checkout.session.async_payment_failed': {
                const session = event.data.object;
                console.log(session, 'payment failed')
                if(!session.paid){
                    let orderId = session.metadata.orderId ;
                    let chargeId = session.id ;
                    let status = "payment-Failed"
                    userHelpers.updatePaymentStatus(orderId, chargeId,  status).then(res=> console.log(res)).catch(err=> console.log(err))
                }
    
                break;
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.log(error,'stripe webhook error');
        res.redirect(`/order-confirmation/${error}`)
    }
    },
}
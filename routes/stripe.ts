require("dotenv").config();
const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();


const stripe = require('stripe')(`${process.env.STRIPE_SECRET}`)


router.get('/test', (req: any, res: { json: (arg0: string) => void; }) => {
    res.json('route hit 🎆')
})

// make stripe payment and show results of payment
router.post('/stripe-webhook', bodyParser.raw({type: 'application/json'}), async (req: { body: any; headers: { [x: string]: any; }; }, res: { json: (arg0: { message?: string; status?: string; }) => void; }) => {
    let event

    try {
        event = stripe.webhooks.constructEvent (
            req.body,
            req.headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch(error) {
        console.log(error)
        res.json({message: 'Server error, try again'})
    }
    const dataObject = event.data.object

    switch(event.type) {
        case 'invoice-paid':
            res.json({status: 'payment successful'})
        break;

        case 'invoice-payment_failed':
            res.json({status: 'payment failure, try again mortal'})
        break;

        case 'customer.subscription.deleted':
            if (event.request != null) {
                res.json({status: 'deleted'})
            }
            else {
                res.json({status: 'error'})
            }
        break;

        default:
    }
});

// create user
router.post ('/create-customer', async(req: { body: { email: any; }; }, res: { json: (arg0: { customer: any; }) => void; }) => {
    
    const customer = await stripe.customers.create({
        email: req.body.email
    })
    res.json({ customer })
})

// create subscription
router.post('/create-subscription', async(req: { body: { paymentMethodId: any; customerId: any; }; }, res: { json: (arg0: { error?: string; substription?: any; }) => void; }) => {

    // let customer: any
    // let invoice_settings: any
    // let default_payment_method: any
    // let items: any
    // let expand: any

    try {
        await stripe.paymentMethods.attach(req.body.paymentMethodId, {
            customer: req.body.customerId
        })
    }
    catch(error) {
        res.json({error: 'error, please try again'})
    }

    await stripe.customers.update(
        req.body.customerId,
        {
            invoice_settings: { default_payment_method: req.body.paymentMethodId }
        }
    )

    const substription = await stripe.subscription.create({
        customer: req.body.customerId,
        items: [{price: 'price'}],
        expand: ['latest_invoice.payment_intent']
    })
    res.json({substription})
})

// send invoice
router.post('/retry-invoice', async (req: { body: { paymentMethodId: any; customerId: any; invoiceId: any; }; }, res: { json: (arg0: { error: any; }) => void; }) => {

    let customer

    try {
        await stripe.paymentMethods.attach(req.body.paymentMethodId, {
            customer: req.body.customerId
        })
        await stripe.customers.update(req.body.customerId, {
            invoice_settings: {
                default_payment_method: req.body.paymentMethodId
            }
        })
    } catch (error) {
        res.json({error})
    }

    const invoice = await stripe.invoices.retrieve(req.body.invoiceId, {
        expant: ['payment_intent']
    })
    res.json(invoice)

})

// cancel subscription
router.post('/cancel-subscription', async (req: { body: { subscriptionId: any; }; }, res: { json: (arg0: any) => void; }) => {

    const deletedSubscription = await stripe.subscriptions.del(req.body.subscriptionId)
    res.json(deletedSubscription)
})

module.exports = router;
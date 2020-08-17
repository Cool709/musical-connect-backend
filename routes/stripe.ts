require("dotenv").config()
const bodyParser = require('body-parser')
const express = require("express")
const router = express.Router()

const stripe = require('stripe')(`${process.env.STRIPE_SECRET}`)

router.post('/stripe-webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
    let event: any

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
    const dataObject: any = event.data.object

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

router.post ('/create-customer', async(req, res) => {
    
    const customer: any = await stripe.customers.create({
        email: req.body.email
    })
    res.json({ customer })
})

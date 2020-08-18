var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
require("dotenv").config();
const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(`${process.env.STRIPE_SECRET}`);
router.get('/test', (req, res) => {
    res.json('route hit 🎆');
});
// make stripe payment and show results of payment
router.post('/stripe-webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => __awaiter(this, void 0, void 0, function* () {
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (error) {
        console.log(error);
        res.json({ message: 'Server error, try again' });
    }
    const dataObject = event.data.object;
    switch (event.type) {
        case 'invoice-paid':
            res.json({ status: 'payment successful' });
            break;
        case 'invoice-payment_failed':
            res.json({ status: 'payment failure, try again mortal' });
            break;
        case 'customer.subscription.deleted':
            if (event.request != null) {
                res.json({ status: 'deleted' });
            }
            else {
                res.json({ status: 'error' });
            }
            break;
        default:
    }
}));
// create user
router.post('/create-customer', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const customer = yield stripe.customers.create({
        email: req.body.email
    });
    res.json({ customer });
}));
// create subscription
router.post('/create-subscription', (req, res) => __awaiter(this, void 0, void 0, function* () {
    // let customer: any
    // let invoice_settings: any
    // let default_payment_method: any
    // let items: any
    // let expand: any
    try {
        yield stripe.paymentMethods.attach(req.body.paymentMethodId, {
            customer: req.body.customerId
        });
    }
    catch (error) {
        res.json({ error: 'error, please try again' });
    }
    yield stripe.customers.update(req.body.customerId, {
        invoice_settings: { default_payment_method: req.body.paymentMethodId }
    });
    const substription = yield stripe.subscription.create({
        customer: req.body.customerId,
        items: [{ price: 'price' }],
        expand: ['latest_invoice.payment_intent']
    });
    res.json({ substription });
}));
// send invoice
router.post('/retry-invoice', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let customer;
    try {
        yield stripe.paymentMethods.attach(req.body.paymentMethodId, {
            customer: req.body.customerId
        });
        yield stripe.customers.update(req.body.customerId, {
            invoice_settings: {
                default_payment_method: req.body.paymentMethodId
            }
        });
    }
    catch (error) {
        res.json({ error });
    }
    const invoice = yield stripe.invoices.retrieve(req.body.invoiceId, {
        expant: ['payment_intent']
    });
    res.json(invoice);
}));
// cancel subscription
router.post('/cancel-subscription', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const deletedSubscription = yield stripe.subscriptions.del(req.body.subscriptionId);
    res.json(deletedSubscription);
}));
module.exports = router;
//# sourceMappingURL=stripe.js.map
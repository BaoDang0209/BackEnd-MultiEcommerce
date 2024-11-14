const sellerModel = require('../../models/sellerModel')
const stripeModel = require('../../models/stripeModel')

const sellerWallet = require('../../models/sellerWallet')
const withdrowRequest = require('../../models/withdrowRequest') 

const {v4: uuidv4} = require('uuid')
const { responseReturn } = require('../../utiles/response')
const { mongo: {ObjectId}} = require('mongoose')
const stripe = require('stripe')('sk_test_51QKz0oE4HLVOpSjji4dGnNnjo3NtS1f0eeCYd69NzqkC6qmdtqox9RZTw7zDyLMSW4cyhPPvBFnaBhDWNPGd8RD500EqTKOCY1')


class paymentController{

    create_stripe_connect_account = async(req,res) => {
        const {id} = req 
        const uid = uuidv4()

    try {
        const stripeInfo = await stripeModel.findOne({ sellerId: id  })

        if (stripeInfo) {
            await stripeModel.deleteOne({ sellerId: id })
            const account = await stripe.accounts.create({ type: 'express' }) 

            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'http://localhost:3000/refresh',
                return_url:  `http://localhost:3000/success?activeCode=${uid}`,
                type: 'account_onboarding'
            })
            await stripeModel.create({
                sellerId: id,
                stripeId: account.id,
                code: uid
            })
            responseReturn(res,201,{url:accountLink.url })

        }else{
            const account = await stripe.accounts.create({ type: 'express' }) 

            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: 'http://localhost:3000/refresh',
                return_url:  `http://localhost:3000/success?activeCode=${uid}`,
                type: 'account_onboarding'
            })
            await stripeModel.create({
                sellerId: id,
                stripeId: account.id,
                code: uid
            })
            responseReturn(res,201,{url:accountLink.url })

        }
        
    } catch (error) {
        console.log('strpe connect account errror' + error.message)
     }
    }
    // End Method 
    active_stripe_connect_account = async (req, res) => {
        const {activeCode} = req.params 
        const {id} = req
 
        try {
             const userStripeInfo = await stripeModel.findOne({ code: activeCode })
 
             if (userStripeInfo) {
                 await sellerModel.findByIdAndUpdate(id,{  
                   payment: 'active'
                 })
                 responseReturn(res, 200, {message: 'payment Active'})
             } else {
                 responseReturn(res, 404, {message: 'payment Active Fails'})
             } 
 
        } catch (error) {
         responseReturn(res, 500, {message: 'Internal Server Error'})
        } 
 
     }
       // End Method 


}


module.exports = new paymentController()
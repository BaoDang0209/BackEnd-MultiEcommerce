const customerAuthController = require('../../controllers/home/customerAuthController')
const { authMiddleware } = require('../../middlewares/authMiddleware')
const router = require('express').Router()

router.get('/customer/get-customer/:Id' , customerAuthController.get_customer)
router.get('/get-customers' , authMiddleware, customerAuthController.get_customers)
router.get('/request-customer-get', authMiddleware, customerAuthController.request_customer_get)
router.put('/customer/customer-login',customerAuthController.update_customer)
router.post('/customer/customer-register',customerAuthController.customer_register)
router.post('/customer/update-password',authMiddleware, customerAuthController.update_password)
router.post('/customer/customer-login',customerAuthController.customer_login)

router.get('/customer/logout',customerAuthController.customer_logout)

module.exports = router 
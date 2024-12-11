const customerAuthController = require('../../controllers/home/customerAuthController')
const { authMiddleware } = require('../../middlewares/authMiddleware')
const router = require('express').Router()

router.get('/get-customer/:Id', customerAuthController.get_customer)
router.get('/get-customers' , customerAuthController.get_customers)
router.get('/request-customer-get', customerAuthController.request_customer_get)

router.put('/customer-update/:id', customerAuthController.update_customer)

router.post('/customer/customer-register',customerAuthController.customer_register)

router.put('/update-password/:id', customerAuthController.update_password)

router.post('/customer/customer-login',customerAuthController.customer_login)

router.get('/customer/logout',customerAuthController.customer_logout)

module.exports = router 
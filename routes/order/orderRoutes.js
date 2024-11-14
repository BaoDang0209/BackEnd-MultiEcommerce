const orderController = require('../../controllers/order/orderController')
const router = require('express').Router()

//Customers
router.post('/home/order/place-order',orderController.place_order)
router.get('/home/customer/get-dashboard-data/:userId',orderController.get_dashboard_data)
router.get('/home/coustomer/get-orders/:customerId/:status',orderController.get_orders)
router.get('/home/coustomer/get-order-details/:orderId',orderController.get_order_details)

//Sellers
router.get('/seller/orders/:sellerId',orderController.get_seller_orders)
router.get('/seller/order/:orderId',orderController.get_seller_order)
router.put('/seller/order-status/update/:orderId',orderController.seller_order_status_update)

module.exports = router  
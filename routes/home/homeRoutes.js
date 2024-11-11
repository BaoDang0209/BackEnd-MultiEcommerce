const homeControllers = require('../../controllers/home/homeControllers') 
const router = require('express').Router()

router.get('/home/get-categorys', homeControllers.get_categorys);
router.get('/home/get-products',homeControllers.get_products)

router.get('/home/price-range-latest-product',homeControllers.price_range_product)
router.get('/home/query-products',homeControllers.query_products)
router.get('/home/product-details/:slug',homeControllers.product_details)

router.post('/home/customer/submit-review',homeControllers.submit_review)
router.get('/home/customer/get-reviews/:productId',homeControllers.get_reviews)
  

module.exports = router 
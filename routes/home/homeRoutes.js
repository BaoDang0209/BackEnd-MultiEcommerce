const homeControllers = require('../../controllers/home/homeControllers') 
const router = require('express').Router()

router.get('/home/get-categorys', homeControllers.get_categorys);
router.get('/home/get-products',homeControllers.get_products)
  

module.exports = router 
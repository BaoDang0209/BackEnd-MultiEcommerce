const homeControllers = require('../../controllers/home/homeControllers') 
const router = require('express').Router()

router.get('/home/get-categorys', homeControllers.get_categorys);
  

module.exports = router 
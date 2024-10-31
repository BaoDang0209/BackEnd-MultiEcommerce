const categoryModel = require('../../models/categoryModel')
const { responseReturn } = require("../../utiles/response")
const queryProducts = require('../../utiles/queryProducts')
const moment = require('moment')
const { mongo: {ObjectId}} = require('mongoose')

class homeControllers{

 
    get_categorys = async(req,res) => {
        try {
            const categorys = await categoryModel.find({})
            responseReturn(res,200, {
                categorys
            })
            
        } catch (error) {
            console.log(error.message)
        }
    }
    // end method 


}

module.exports = new homeControllers()
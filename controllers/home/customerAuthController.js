const customerModel = require('../../models/customerModel')
const { responseReturn } = require('../../utiles/response')
const bcrypt = require('bcrypt')
const sellerCustomerModel = require('../../models/chat/sellerCustomerModel')
const {createToken} = require('../../utiles/tokenCreate')

class customerAuthController{

    customer_get = async(req,res) => {

    }

    const update_customer = async (req, res) => {
        const form = formidable();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 404, { error: 'Something went wrong' });
            } else {
                let { name, email, address, phoneNumber, method } = fields;
                let { image } = files;
                const { id } = req.params;
    
                // Clean up input data if needed
                if (name) name = name.trim();
                if (email) email = email.trim();
    
                try {
                    let result = null;
                    if (image) {
                        cloudinary.config({
                            cloud_name: process.env.CLOUD_NAME,
                            api_key: process.env.API_KEY,
                            api_secret: process.env.API_SECRET,
                            secure: true
                        });
    
                        result = await cloudinary.uploader.upload(image.filepath, { folder: 'customers' });
                    }
    
                    // Prepare update data
                    const updateData = {
                        ...(name && { name }),
                        ...(email && { email }),
                        ...(address && { address }),
                        ...(phoneNumber && { phoneNumber }),
                        ...(method && { method })
                    };
    
                    if (result) {
                        updateData.image = result.url;
                    }
    
                    const customer = await customerModel.findByIdAndUpdate(id, updateData, { new: true });
                    if (!customer) {
                        return responseReturn(res, 404, { error: 'Customer not found' });
                    }
    
                    responseReturn(res, 200, { customer, message: 'Customer updated successfully' });
                } catch (error) {
                    responseReturn(res, 500, { error: 'Internal Server Error' });
                }
            }
        });
    }

    customer_register = async(req,res) => {
        const {name, email, password } = req.body

        try {
            const customer = await customerModel.findOne({email}) 
            if (customer) {
                responseReturn(res, 404,{ error : 'Email Already Exits'} )
            } else {
                const createCustomer = await customerModel.create({
                    name: name.trim(),
                    email: email.trim(),
                    password: await bcrypt.hash(password, 10),
                    method: 'menualy'
                })
                await sellerCustomerModel.create({
                    myId: createCustomer.id
                })
                const token = await createToken({
                    id : createCustomer.id,
                    name: createCustomer.name,
                    email: createCustomer.email,
                    method: createCustomer.method 
                })
                res.cookie('customerToken',token,{
                    expires : new Date(Date.now() + 7*24*60*60*1000 )
                })
                responseReturn(res,201,{message: "User Register Success", token})
            }
        } catch (error) {
            console.log(error.message)
        }
    }
    // End Method

    customer_login = async(req, res) => {
       const { email, password } =req.body
       try {
        const customer = await customerModel.findOne({email}).select('+password')
        if (customer) {
            const match = await bcrypt.compare(password, customer.password)
            if (match) {
                const token = await createToken({
                    id : customer.id,
                    name: customer.name,
                    email: customer.email,
                    method: customer.method 
                })
                res.cookie('customerToken',token,{
                    expires : new Date(Date.now() + 7*24*60*60*1000 )
                })
                responseReturn(res, 201,{ message :  'User Login Success',token})
                
            } else {
                responseReturn(res, 404,{ error :  'Password Wrong'})
            }
        } else {
            responseReturn(res, 404,{ error :  'Email Not Found'})
        }
        
       } catch (error) {
        console.log(error.message)
       }
    }
  // End Method

    customer_logout = async(req, res) => {
        res.cookie('customerToken',"",{
            expires : new Date(Date.now())
        })
        responseReturn(res, 200,{ message :  'Logout Success'})
    }
    // End Method

}

module.exports = new customerAuthController()
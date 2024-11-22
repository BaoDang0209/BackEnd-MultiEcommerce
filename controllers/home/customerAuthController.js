const customerModel = require('../../models/customerModel')
const { responseReturn } = require('../../utiles/response')
const bcrypt = require('bcrypt')
const {createToken} = require('../../utiles/tokenCreate')
const formidable = require("formidable")
class customerAuthController{
    
    request_customer_get = async (req, res) => {
        const {page,searchValue, parPage} = req.query 
        const skipPage = parseInt(parPage) * (parseInt(page) - 1)

        try {
            if (searchValue) {
                
            } else {
                const customers = await customerModel.find({ status:  'pending'}).skip(skipPage).limit(parPage).sort({ createdAt: -1})
                const totalCustomer = await customerModel.find({ status: 'pending' }).countDocuments()
                responseReturn(res, 200,{ customers,totalCustomer })
            }
        } catch (error) {
            responseReturn(res, 500,{ error: error.message }) 
        }
 
    }

    get_customer = async(req,res) => {
        const {Id} = req.params
        try {
            const customer = await customerModel.findById(Id)
            responseReturn(res, 200,{ customer })
        } catch (error) {
            responseReturn(res, 500,{ error: error.message })
        }
    }
    get_customers = async (req, res) => {
        let {page,searchValue,parPage} = req.query
        page = parseInt(page)
        parPage= parseInt(parPage)

        const skipPage = parPage * (page - 1)

        try {
            if (searchValue) {
                const customers = await customerModel.find({
                    $text: { $search: searchValue},
                    method: 'menualy'
                }).skip(skipPage).limit(parPage).sort({createdAt : -1})

                const totalCustomer = await customerModel.find({
                    $text: { $search: searchValue},
                    method: 'menualy'
                }).countDocuments()
                responseReturn(res, 200, {totalCustomer,customers})
            } else {
                const customers = await customerModel.find({ method: 'menualy'
                }).skip(skipPage).limit(parPage).sort({createdAt : -1})

                const totalCustomer = await customerModel.find({ method: 'menualy'
                }).countDocuments()
                responseReturn(res, 200, {totalCustomer,customers})
            }
            
        } catch (error) {
            console.log('active seller get ' + error.message)
        }
    };

    update_customer = async (req, res) => {
        const form = formidable();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                responseReturn(res, 404, { error: 'Something went wrong' });
            } else {
                let { name, email, address, phoneNumber, gender } = fields;
                let { image } = files;
                const { id } = req.params;
    
                // Trim input fields
                name = name ? name.trim() : undefined;
                email = email ? email.trim() : undefined;
                address = address ? address.trim() : undefined;
                phoneNumber = phoneNumber ? phoneNumber.trim() : undefined;
                gender = gender ? gender.trim() : undefined;
                try {
                    let result = null;
                    if (image) {
                        // Configure Cloudinary
                        cloudinary.config({
                            cloud_name: process.env.cloud_name,
                            api_key: process.env.api_key,
                            api_secret: process.env.api_secret,
                            secure: true
                        });
    
                        // Upload image to Cloudinary
                        result = await cloudinary.uploader.upload(image.filepath, { folder: 'customers' });
                    }
    
                    // Create update data
                    const updateData = {
                        name,
                        email,
                        address,
                        phoneNumber,
                        gender,
                    };
    
                    if (result) {
                        updateData.image = result.url;
                    }
    
                    // Update the customer document
                    const customer = await customerModel.findByIdAndUpdate(id, updateData, { new: true });
                    responseReturn(res, 200, { customer, message: 'Customer updated successfully' });
    
                } catch (error) {
                    responseReturn(res, 500, { error: 'Internal Server Error' });
                }
            }
        });
    }
    
    update_password = async (req, res) => {
        const { id } = req.params; 
        const { currentPassword, newPassword, confirmPassword } = req.body;
    
        try {
            const user = await customerModel.findById(id).select('+password');
    
            if (!user) {
                return responseReturn(res, 404, { error: 'User not found' });
            }
    
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return responseReturn(res, 400, { error: 'Current password is incorrect' });
            }
    
            if (newPassword !== confirmPassword) {
                return responseReturn(res, 400, { error: 'New password and confirm password do not match' });
            }
    
            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
    
            responseReturn(res, 200, { message: 'Password updated successfully' });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    };    

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
                    method: 'menualy',
                    status: 'active',
                })
                const token = await createToken({
                    id : createCustomer.id,
                    name: createCustomer.name,
                    email: createCustomer.email,
                    method: createCustomer.method, 
                    status: createCustomer.status
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
                    method: customer.method, 
                    status: customer.status
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
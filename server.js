const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { dbConnect } = require('./utiles/db')


app.use(cors({
    origin : ['http://localhost:3000','http://localhost:3001'],
    credentials: true
}))

app.use(bodyParser.json())
app.use(cookieParser())

app.use('/api',require('./routes/home/homeRoutes'))
app.use('/api',require('./routes/home/customerAuthRoutes'))
app.use('/api',require('./routes/home/cardRoutes'))
app.use('/api',require('./routes/order/orderRoutes'))
app.use('/api' , require('./routes/authRoutes'))
app.use('/api',require('./routes/dashboard/categoryRoutes'))
app.use('/api',require('./routes/dashboard/productRoutes'))
app.use('/api',require('./routes/dashboard/sellerRoutes'))
app.use('/api',require('./routes/paymentRoutes'))
app.use('/api',require('./routes/dashboard/dashboardRoutes'))
app.use('/api', require('./routes/chatbotRoutes'))



app.get('/',(req,res) => res.send('Hello Server'))
const port = process.env.PORT
dbConnect()
app.listen(port, () => console.log(`Server is running on port ${port}`))

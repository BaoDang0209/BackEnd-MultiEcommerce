const { OpenAI } = require('openai');
const Product = require('../../models/productModel');

// Khởi tạo OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

console.log('OpenAI API Key:', process.env.OPENAI_API_KEY);

// Hàm tạo phản hồi cuối cùng từ OpenAI
async function generateChatGPTResponse(userMessage, products) {


    const promptTemplate = `
Bạn là một trợ lý AI tư vấn sản phẩm cho khách hàng. Dưới đây là danh sách các sản phẩm hiện có trong cửa hàng của chúng tôi:

${products.map(product => `
- Tên sản phẩm: ${product.name}
- Loại: ${product.category === 'Mobile' ? 'Điện thoại' : 'Laptop'}
- Mô tả: ${product.description || 'Không có mô tả'}
- Giá: ${product.price} VND
- Thương hiệu: ${product.brand}
- Giảm giá: ${product.discount}%
- Số lượng còn: ${product.stock}
- Đánh giá: ${product.rating} sao
- Đường link: http://localhost:3000/product/details/${product.slug}
-----------------------------`).join('\n')}

Câu hỏi của người dùng: "${userMessage}"

1. Nếu người dùng hỏi về sản phẩm **điện thoại**, chỉ cung cấp thông tin sản phẩm có \`category\` là \`Mobile\`.
2. Nếu người dùng hỏi về sản phẩm **laptop**, chỉ cung cấp thông tin sản phẩm có \`category\` là \`LapTop\`.
3. Khi người dùng yêu cầu sản phẩm "đắt nhất", bạn cần tìm kiếm sản phẩm có \`giá\` cao nhất trong loại được yêu cầu.
4. Trả lời như một nhân viên bán hàng.
`;




    console.log("Prompt gửi lên OpenAI:", promptTemplate);

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'Bạn là một trợ lý AI chuyên tư vấn sản phẩm, chỉ trả lời thông tin có trong cơ sở dữ liệu.' },
            { role: 'user', content: promptTemplate },
        ],
    });

    return response.choices[0].message.content.trim();
}


// Hàm xử lý yêu cầu chatbot
async function handleChatRequest(req, res) {
    try {
        const { message: userMessage } = req.body;

        if (!userMessage) {
            return res.status(400).json({ error: 'Lỗi 400: Không có tin nhắn.' });
        }

        // Thực hiện truy vấn MongoDB để lấy sản phẩm
        const products = await Product.find();

        // Xử lý câu hỏi để lọc loại sản phẩm
        let filteredProducts = products;

        if (userMessage.toLowerCase().includes('điện thoại')) {
            filteredProducts = products.filter(product => product.category === 'Mobile');
        } else if (userMessage.toLowerCase().includes('laptop')) {
            filteredProducts = products.filter(product => product.category === 'LapTop');
        }
        else filteredProducts =products
        // Tạo phản hồi cuối cùng từ OpenAI với thông tin sản phẩm
        const finalResponse = await generateChatGPTResponse(userMessage, filteredProducts);


        res.json({ response: finalResponse });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
    }
}

module.exports = { handleChatRequest };

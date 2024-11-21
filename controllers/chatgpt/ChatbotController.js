    const { OpenAI } = require('openai');
    const Product = require('../../models/productModel');

    // Khởi tạo OpenAI API
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('OpenAI API Key:', process.env.OPENAI_API_KEY);

    // Prompt tạo truy vấn MongoDB
    const promptTemplate = `
    Bạn là một trợ lý AI chỉ giúp tư vấn về sản phẩm. Người dùng sẽ hỏi về các sản phẩm trong cơ sở dữ liệu. 
    Khi nhận được câu hỏi, bạn chỉ cần trả lời về các sản phẩm tương ứng, không trả lời gì khác ngoài thông tin về sản phẩm. 
    Các trường trong cơ sở dữ liệu sản phẩm bao gồm: \`name\`, \`slug\`, \`category\`, \`brand\`, \`price\`, \`stock\`, \`discount\`, \`description\`, \`rating\`. 

    Dưới đây là câu hỏi của người dùng: "{userMessage}"

    Chỉ trả lời thông tin về sản phẩm, ví dụ:
    - Tên sản phẩm: iPhone 13
    - Mô tả: Điện thoại thông minh mạnh mẽ
    - Giá: 20,000,000 VND
    - Thương hiệu: Apple
    - Giảm giá: 10%
    - Số lượng còn: 50
    - Đánh giá: 4.5 sao
    - Đường link: http://localhost:3000/product/details/ip-13

    Nếu không tìm thấy sản phẩm nào, trả lời: "Không có sản phẩm nào phù hợp với yêu cầu của bạn."
    `;

    // Hàm tạo phản hồi cuối cùng từ OpenAI
    async function generateChatGPTResponse(userMessage, products) {
        // Chuyển đổi danh sách sản phẩm thành một chuỗi văn bản để gửi cho OpenAI
        const productInfo = products.map(product => `
    Tên sản phẩm: ${product.name}
    Mô tả: ${product.description || 'Không có mô tả'}
    Giá: ${product.price} VND
    Thương hiệu: ${product.brand}
    Giảm giá: ${product.discount}%
    Số lượng còn: ${product.stock}
    Đánh giá: ${product.rating} sao
    Đường link: http://localhost:3000/product/details/${product.slug}

    -----------------------------`).join('\n');
        console.log(productInfo);

        // Tạo phản hồi từ OpenAI với thông tin về sản phẩm
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Bạn là một trợ lý AI tư vấn bán hàng chỉ trả lời về các sản phẩm. Không được trả lời bất kì gì khác ngoài dữ liệu trong database.' },
                { role: 'user', content: `Câu hỏi: ${userMessage}\nThông tin sản phẩm: ${productInfo}.\n` },
            ],
        });
        
        return response.choices[0].message.content.trim();
    }

    // Hàm xử lý yêu cầu chatbot
    async function handleChatRequest(req, res) {
        try {
            const { message: userMessage } = req.body;
            console.log('User message:', userMessage);  // Log message nhận được từ Postman

            if (!userMessage) {
                return res.status(400).json({ error: 'Lỗi 400: Không có tin nhắn.' });
            }

            // Thực hiện truy vấn MongoDB để lấy sản phẩm
            const products = await Product.find();

            // Tạo phản hồi cuối cùng từ OpenAI với thông tin sản phẩm
            const finalResponse = await generateChatGPTResponse(userMessage, products);

            res.json({ response: finalResponse });
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
        }
    }

    module.exports = { handleChatRequest };

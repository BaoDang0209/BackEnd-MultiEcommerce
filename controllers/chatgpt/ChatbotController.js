const { OpenAI } = require('openai');
const Product = require('../../models/productModel');

// Initialize OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate MongoDB query from AI response
async function generateChatGPTResponse(userMessage) {
    const promptTemplate =
        `
    You are an AI assistant that generates **valid Mongoose MongoDB aggregation queries** based on user questions.
    The Product schema has the following fields: name, slug, category, brand, price, stock, discount, rating.

    ### Instructions:
    1. Convert the user question into a MongoDB aggregation query using **Mongoose aggregation syntax**.
    2. For case-insensitive text matching, use **$regex** with the "i" flag in the $match stage.
    3. The response must only include the MongoDB aggregation pipeline array.
    4. Do not include explanations or other content—just the pipeline array.
    5. phone mean category:mobile

    ### Example format:
    [
        { $match: { field: { $regex: /value/i } } },
        { $sort: { field: 1 } },
        { $limit: 10 }
    ]

    User Question: "${userMessage}"
    `
        ;

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0,
        messages: [
            { role: 'system', content: 'You generate precise MongoDB aggregation queries for product searches.' },
            { role: 'user', content: promptTemplate },
        ],
    });

    return response.choices[0].message.content.trim();
}


// Function to generate an OpenAI response for fallback
async function generateChatGPTResponse2(userMessage, products) {
    const promptTemplate2 = `
Bạn là một trợ lý AI tư vấn sản phẩm cho khách hàng. Dưới đây là danh sách các sản phẩm hiện có trong cửa hàng của chúng tôi:

${products.map(product => `
- Tên sản phẩm: ${product.name}
- Loại: ${product.category}
- Mô tả: ${product.description || 'Không có mô tả'}
- Giá: ${product.price} VND
- Thương hiệu: ${product.brand}
- Giảm giá: ${product.discount}%
- Số lượng còn: ${product.stock}
- Đánh giá: ${product.rating} sao
- Đường link: http://localhost:3000/product/details/${product.slug}
-----------------------------`).join('\n')}
đồng thời ngoài các trường name, slug, category, brand, price, stock, discount, rating. 
Bạn nên tham khảo nguồn bên ngoài để đưa ra đánh giá cũng như yêu cầu của khách hàng tốt nhất. Nhưng chỉ quanh những sản phẩm có trong cửa hàng.
Câu hỏi của người dùng: "${userMessage}"

`
        ;


    const response2 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        messages: [
            { role: 'system', content: 'Bạn là một trợ lý AI chuyên tư vấn sản phẩm, chỉ trả lời thông tin có trong cơ sở dữ liệu, ' },
            { role: 'user', content: promptTemplate2 },
        ],

    });

    return response2.choices[0].message.content.trim();
}
async function executeMongoQuery(queryString) {
    try {
        console.log("Generated Query String:", queryString);

        // Regex để tìm điều kiện liên quan đến category
        const matchCategoryRegex = /{ category: \{ \$regex: [^}]*\} }/;

        // Tìm điều kiện category
        const categoryMatch = queryString.match(matchCategoryRegex);

        console.log("============================================");
        console.log("Tìm thấy category:", categoryMatch);
        console.log("============================================");

        // Nếu tìm thấy điều kiện category
        let extractedCategoryMatch = null;
        if (categoryMatch && categoryMatch.length > 0) {
            extractedCategoryMatch = `{ $match: ${categoryMatch[0]} }`;
        }

        console.log("Điều kiện category đã tách:", extractedCategoryMatch);

        // Kiểm tra định dạng pipeline
        if (!queryString.startsWith('[') || !queryString.endsWith(']')) {
            console.log("Lỗi 105");
            throw new Error('Invalid query format: Must be a valid Aggregation pipeline array.');
        }

        // Parse Aggregation pipeline
        const pipeline = eval(queryString);
        console.log("pipeline", pipeline);
        if (!Array.isArray(pipeline)) {
            console.log("Lỗi 112");
            throw new Error('Invalid query format: Expected an array.');
        }

        // Thực thi Aggregation query
        const results = await Product.aggregate(pipeline);
        return { results, extractedCategoryMatch };
    } catch (error) {
        console.error('Query Execution Error:', error);
        throw error;
    }
}







// Handle chatbot request
async function handleChatRequest(req, res) {
    try {
        const { message: userMessage } = req.body;

        if (!userMessage) {
            return res.status(400).json({ error: 'Error 400: No message.' });
        }

        // Generate Aggregation pipeline from AI
        const aggregationPipeline = await generateChatGPTResponse(userMessage);

        // Execute the Aggregation query
        let queryResults = await executeMongoQuery(aggregationPipeline);

        console.log("============================================");
        console.log("Kết quả truy vấn ban đầu:");
        console.log(queryResults.results);
        console.log("============================================");

        // Nếu kết quả rỗng, sử dụng extractedCategoryMatch
        if (queryResults.results.length === 0 && queryResults.extractedCategoryMatch) {
            console.log("Kết quả rỗng, sử dụng truy vấn điều kiện category thay thế...");

            const categoryRegex = /\/([^/]+)\//;
            const categoryMatch = queryResults.extractedCategoryMatch.match(categoryRegex);

            let category = null; // Default fallback
            if (categoryMatch && categoryMatch[1]) {
                category = categoryMatch[1];
            }

            const fallbackPipeline = [
                {
                    $match: {
                        category: {
                            $regex: new RegExp(category, 'i')
                        }
                    }
                }
            ];
            console.log("fallbackPipeline", fallbackPipeline);

            const fallbackResults = await Product.aggregate(fallbackPipeline);
            console.log("fallbackResults", fallbackResults)

            const aggregationPipeline2 = await generateChatGPTResponse2(userMessage, fallbackResults);
            console.log("aggregationPipeline", aggregationPipeline2)

            console.log(aggregationPipeline2)

            return res.json({
                response2: aggregationPipeline,
                results2: fallbackResults,
                fallbackUsed: true,
                final_result_chat: aggregationPipeline2
            });
        }
        else {
            const aggregationPipeline2 = await generateChatGPTResponse2(userMessage, queryResults.results);
            // Trả về kết quả ban đầu nếu không rỗng
            res.json({
                response: aggregationPipeline,
                results: queryResults.results,
                fallbackUsed: false,
                final_result_chat: aggregationPipeline2
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred processing the request.' });
    }
}



module.exports = { handleChatRequest };
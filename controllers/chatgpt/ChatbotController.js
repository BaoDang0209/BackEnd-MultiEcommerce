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
async function generateFallbackResponse(category, products) {
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

Câu hỏi của người dùng: "${userMessage}"
`
;


    const response2 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        messages: [
            { role: 'system', content: 'Bạn là một trợ lý AI chuyên tư vấn sản phẩm, chỉ trả lời thông tin có trong cơ sở dữ liệu.' },
            { role: 'user', content: promptTemplate2 },
        ],

    });

    return response2.choices[0].message.content.trim();
}
// Function to execute the generated MongoDB query
// Function to execute the generated MongoDB query
async function executeMongoQuery(queryString) {
    try {
        console.log("Generated Query String:", queryString);

        // Regex to find the category condition
        const matchCategoryRegex = /{ category: \{ \$regex: [^}]*\} }/;

        // Find category condition
        const categoryMatch = queryString.match(matchCategoryRegex);
        console.log("============================================");
        console.log("Found category:", categoryMatch);
        console.log("============================================");

        // Extract category match if found
        let extractedCategoryMatch = null;
        if (categoryMatch && categoryMatch.length > 0) {
            extractedCategoryMatch = JSON.parse(categoryMatch[0]);
        }

        console.log("Extracted category condition:", extractedCategoryMatch);

        // Check if the query string is in valid format
        if (!queryString.startsWith('[') || !queryString.endsWith(']')) {
            throw new Error('Invalid query format: Must be a valid Aggregation pipeline array.');
        }

        // Parse Aggregation pipeline safely
        const pipeline = JSON.parse(queryString);
        if (!Array.isArray(pipeline)) {
            throw new Error('Invalid query format: Expected an array.');
        }

        // Execute Aggregation query
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
        console.log("Initial query results:");
        console.log(queryResults.results);
        console.log("============================================");

        // If results are empty, use extracted category match
        if (queryResults.results.length === 0 && queryResults.extractedCategoryMatch) {
            console.log("Empty results, using fallback category query...");

            const fallbackPipeline = [queryResults.extractedCategoryMatch];

            const fallbackResults = await Product.aggregate(fallbackPipeline);
        
            return res.json({
                response: aggregationPipeline,
                results: fallbackResults,
                fallbackUsed: true,
            });
        }
        
        // Return initial results if not empty
        res.json({
            response: aggregationPipeline,
            results: queryResults.results,
            fallbackUsed: false,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred processing the request.' });
    }
}

module.exports = { handleChatRequest };
const express = require('express');
const axios = require('axios');
const router = express.Router();
const multer = require('multer');
const User= require('../models/User');
const authenticateToken = require('../middlewares/auth'); 
require('dotenv').config();

const LAMBDA_API_URL =process.env.URILAMA

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/',authenticateToken, async(req,res)=>{
const user= await User.findById(req.user.userId);
  res.render('chatbot',{user});

})

// Endpoint to handle image upload and analysis
router.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const imageBase64 = req.file.buffer.toString("base64");

    // Step 1: Call the Vision Model to analyze the image
    const visionResponse = await axios.post(
      "https://api.sambanova.ai/v1/chat/completions",
      {
        stream: true,
        model: "Meta-Llama-3.1-8B-Instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What do you see in this image?" },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Vision Model Response:", visionResponse.data); 

    // Step 2: Extract the content (ingredients, etc.) from the response
    const extractedContent = visionResponse.data.choices[0].message.content;

    // Step 3: Store the extracted content for future Q&A (you can store it in a session or database)
    // For simplicity, we'll just send it back to the user here.
    res.json({ ingredients: extractedContent });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error analyzing image");
  }
});

// Endpoint for chatbot interactions using Meta-Llama-3.3-70B-Instruct
router.post("/chat", async (req, res) => {
  try {
//console.log(req.body);
//console.log(req.headers);
    const extractedIngredients = req.body.ingredients;  // Get the extracted content (ingredients, etc.)
    
//console.log(extractedIngredients);
    // Create the prompt for recipe generation
    const prompt = `You are an AI recipe generator. Given the following list of ingredients, generate 1 recipe. The recipe should be structured in the following JSON format:

{
  "recipes": [
    {
      "title": "{Recipe Name}",
      "ingredients": [
        "{Ingredient 1}",
        "{Ingredient 2}",
        "{Ingredient 3}"
      ],
      "instructions": "{Instructions to cook the dish}"
    }
  ]
}

**Ingredients Provided**: ${extractedIngredients}

Ensure each recipe includes:
1. A descriptive title for the recipe.
2. A list of ingredients relevant to the provided ingredients.
3. small cooking instructions.

Respond only with the Proper JSON structure.`;

    // Step 4: Pass the extracted content and the user's question to the text model
    const response = await axios.post(
      "https://api.sambanova.ai/v1/chat/completions",
      {
        stream: true,
        model: "Meta-Llama-3.3-70B-Instruct",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    //console.log( response.data);

    const lines = response.data.split('\n');

const dataLines = lines.filter(line => line.startsWith('data:'));

const jsonData = dataLines.map(line => {
  const cleanLine = line.replace(/^data:\s*/, '');
  return cleanLine !== '[DONE]' ? JSON.parse(cleanLine) : null;
}).filter(entry => entry !== null);
let accumulatedDelta = '';

jsonData.forEach(chunk => {
  if (chunk.choices[0].delta.content) {
    accumulatedDelta += chunk.choices[0].delta.content;
  }
});

console.log(accumulatedDelta); 
res.json({ accumulatedDelta });


  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error in chatbot response");
  }
});

module.exports = router;

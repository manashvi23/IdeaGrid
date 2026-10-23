require('dotenv').config(); 
const { GoogleGenAI } = require('@google/genai');

// 1. Verify the key is loaded from the .env file
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY is missing from your .env file!");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runTest() {
  try {
    console.log("⏳ Connecting to Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Reply with exactly the word 'SUCCESS' if you can read this message."
    });
    
    console.log("🤖 Response from AI:", response.text.trim());
    console.log("✅ Everything is configured correctly!");
  } catch (error) {
    console.error("❌ API Test Failed:", error.message);
  }
}

runTest();
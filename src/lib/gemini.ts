import { GoogleGenerativeAI } from "@google/generative-ai";

// Support multiple common environment variable names
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.API_KEY ||
  "";

if (!apiKey) {
  // Silent console error to avoid spamming server logs too much, but visible enough
  console.error("❌ ERROR: No Gemini API KEY found in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Allow user to override model via env, default to gemini-1.5-pro for better quality
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";

export const geminiModel = genAI.getGenerativeModel({
  model: modelName,
});

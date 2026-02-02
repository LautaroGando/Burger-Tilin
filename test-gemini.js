const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env");
let apiKey = "";

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim();
        if (
          key === "GOOGLE_GENERATIVE_AI_API_KEY" ||
          key === "GEMINI_API_KEY"
        ) {
          apiKey = val.replace(/["']/g, ""); // remove quotes if any
          break; // Found it
        }
      }
    }
  }
} catch (e) {
  console.log("Error reading env:", e);
}

if (!apiKey) {
  console.error("❌ No API KEY found in .env");
  process.exit(1);
}

console.log("🔑 Testing with API KEY: " + apiKey.substring(0, 5) + "...");

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro",
  ];

  console.log("Checking models availability...");

  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      const response = await result.response;
      console.log(`✅ ${modelName}: AVAILABLE`);
    } catch (e) {
      let msg = e.message || "" + e;
      if (msg.includes("404") || msg.includes("Not Found")) {
        console.log(`❌ ${modelName}: Not Found (404)`);
      } else if (msg.includes("403") || msg.includes("Forbidden")) {
        console.log(
          `⛔ ${modelName}: Forbidden (403) - Key invalid for this model`,
        );
      } else {
        console.log(`⚠️ ${modelName}: Error - ` + msg.split("\n")[0]);
      }
    }
  }
}

listModels();

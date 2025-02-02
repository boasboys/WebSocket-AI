const WebSocket = require("ws");
const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();

// const openai = new OpenAI({
//   // apiKey: process.env.API_KEY, // Ensure this is correct
// });

async function getAIResponse(prompt) {
   // Log prompt
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Ensure this model is available
      messages: [
        { role: "system", content: "You are a helpful assistant.You are a JSON-formatted AI assistant. For every question asked by the user, respond with a structured JSON object. The JSON object should:- Use the question as the key (in snake_case if applicable).- Provide a clear and concise answer as the value.Always return a valid JSON object. Do not include any text outside of the JSON format. " },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const response = completion.choices[0].message.content.trim();
    // console.log(`[OpenAI] Generated response: "${response}"`); // Log response
    return response;
  } catch (error) {
    console.error("[OpenAI] API Error:", error.message); // Log error
    return "Sorry, there was an error processing your request.";
  }
}

const wss = new WebSocket.Server({ port: process.env.PORT, host: "0.0.0.0" });
// console.log(`[WebSocket] Server is running on ws://0.0.0.0:${process.env.PORT}`);

wss.on("connection", (ws) => {
  console.log(`[WebSocket] Client connected.`);
  ws.send("Welcome! The AI model is ready. Ask your question.");

  ws.on("message", async (message) => {
    // console.log(`[WebSocket] Message received from client: "${message}"`);
    try {
      const aiResponse = await getAIResponse(message.toString());
      // console.log(`[WebSocket] Sending response to client: "${aiResponse}"`);
      ws.send(aiResponse); // Send response back to client
    } catch (error) {
      console.error("[WebSocket] Error processing message:", error);
      ws.send("Sorry, there was an error processing your request.");
    }
  });

  ws.on("close", () => console.log("[WebSocket] Client disconnected."));
  ws.on("error", (error) => console.error("[WebSocket] Error:", error.message));
});
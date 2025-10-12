const { Groq } = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function getAiResponse(messages) {
  try {
    // Filter out system messages and format messages for Groq API
    const formattedMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // If no messages, return error
    if (formattedMessages.length === 0) {
      return "Please send a message to start the conversation.";
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Valid Groq model
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    const content = completion.choices[0]?.message?.content || "No response generated.";
    return content;
  } catch (error) {
    console.error("Error fetching AI response:", error.message);
    
    // Provide more specific error messages
    if (error.message.includes('API key')) {
      return "Sorry, there's an issue with the API configuration. Please check your API key.";
    }
    if (error.message.includes('rate limit')) {
      return "Sorry, we've hit the rate limit. Please try again in a moment.";
    }
    
    return "Sorry, I encountered an error while generating a response. Please try again.";
  }
}

module.exports = { getAiResponse };

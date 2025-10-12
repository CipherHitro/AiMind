const { Groq } = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateChatTitle(userMessage) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates short, concise chat titles. Generate a title that is 2-5 words long, captures the main topic of the user's message, and is in title case. Only respond with the title, nothing else."
        },
        {
          role: "user",
          content: `Generate a short title (2-5 words) for a chat that starts with this message: "${userMessage}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 20,
      top_p: 1,
      stream: false,
    });

    let title = completion.choices[0]?.message?.content?.trim() || "New Chat";
    
    // Remove quotes if AI wrapped the title in them
    title = title.replace(/^["']|["']$/g, '');
    
    // Ensure title is not too long (max 50 characters)
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title;
  } catch (error) {
    console.error("Error generating chat title:", error.message);
    
    // Fallback: Use first few words of the message
    const words = userMessage.trim().split(' ').slice(0, 4).join(' ');
    return words.length > 50 ? words.substring(0, 47) + '...' : words;
  }
}

module.exports = { generateChatTitle };

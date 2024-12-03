const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

class GeminiAPI {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
  }

  async startInterview(jobTitle) {
    try {
      if (!jobTitle || typeof jobTitle !== "string") {
        throw new Error(
          "Invalid job title: Job title must be a non-empty string"
        );
      }

      const prompt = `You are an AI interviewer conducting a job interview for the ${jobTitle} position. 
            Start the interview by introducing yourself briefly and asking the first question. 
            Focus on introductory topics, such as understanding the candidate's basic knowledge of the role. 
            Keep your response concise and professional. This is question 1 of 6.`;

      const result = await this.model.generateContent(prompt);
      return {
        response: result.response.text(),
        questionCount: 1,
        conversationContext: [prompt], // Store the conversation context dynamically
      };
    } catch (error) {
      console.error("Error starting interview:", error);
      throw error;
    }
  }

  async generateResponse(
    prompt,
    jobTitle,
    questionCount,
    conversationContext = []
  ) {
    try {
      if (!prompt || typeof prompt !== "string") {
        throw new Error("Invalid prompt: Prompt must be a non-empty string");
      }

      if (!Array.isArray(conversationContext)) {
        console.warn(
          "conversationContext was not an array. Initializing to an empty array."
        );
        conversationContext = [];
      }

      const nextQuestionCount = questionCount + 1;
      let dynamicInstruction;

      // Diversify question types and logic
      if (nextQuestionCount === 2) {
        dynamicInstruction =
          "Ask a knowledge-based question to assess the candidate's technical understanding.";
      } else if (nextQuestionCount === 3) {
        dynamicInstruction =
          "Ask a problem-solving question. Present a hypothetical scenario where the candidate needs to solve a technical challenge.";
      } else if (nextQuestionCount === 4) {
        dynamicInstruction =
          "Ask a behavioral question to understand how the candidate has handled challenges in the past. Focus on teamwork, conflict resolution, or leadership.";
      } else if (nextQuestionCount === 5) {
        dynamicInstruction =
          "Ask a situational question. Provide a realistic workplace scenario and ask how the candidate would respond.";
      } else if (nextQuestionCount === 6) {
        dynamicInstruction = "Ask a technical demonstration question.";
      } else {
        dynamicInstruction = `The interview is complete. Based on the following interview responses, provide constructive feedback.
            Section your feedback with headings and a nice readable, uniform layout.
            Go through all 6 questions one by one and give specific feedback on their answers to them.
            If any answers were wrong, let them know what is was, and what a better or correct answer could have been. Likewise if they were correct or answered well. Do this in detail.            
            Include specific examples of the candidate's strengths and areas for improvement.             
            Also, give actionable suggestions for how they can perform better in future interviews.`;
      }

      const systemPrompt = `You are an AI interviewer conducting a job interview for the ${jobTitle} position. 
            ${dynamicInstruction} Vary the question style and make the interview feel engaging and realistic. Keep the tone professional and concise.`;

      const fullPrompt =
        nextQuestionCount <= 6
          ? `${systemPrompt}\n\nPrevious context:\n${conversationContext.join(
              "\n"
            )}\n\nCandidate's latest response: ${prompt}\n\nAsk your next question:`
          : `${systemPrompt}\n\nInterview context:\n${conversationContext.join(
              "\n"
            )}\n\nCandidate's final response: ${prompt}\n\nProvide your feedback:`;

      const result = await this.model.generateContent(fullPrompt);

      conversationContext.push(prompt); // Add the latest response to context

      return {
        response: result.response.text(),
        questionCount: nextQuestionCount,
        conversationContext,
        isComplete: nextQuestionCount > 6,
      };
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  }

  // Helper method for personalized feedback
  createFeedback(conversationContext) {
    try {
      const feedbackPrompt = `Based on the following interview responses, provide constructive feedback.
            Go through each question one by one and give specific feedback on their answers to them.
            If any answers were wrong, let them know what is was, and what a better or correct answer should have been. 
            Include specific examples of the candidate's strengths and areas for improvement.
            Section your feedback with headings and a nice readable, uniform layout. 
            Also, give actionable suggestions for how they can perform better in future interviews.\n\nResponses:\n${conversationContext.join(
              "\n"
            )}`;

      return this.model.generateContent(feedbackPrompt);
    } catch (error) {
      console.error("Error generating feedback:", error);
      throw error;
    }
  }
}

module.exports = new GeminiAPI();

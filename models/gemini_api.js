const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class GeminiAPI {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
        });
    }

    async startInterview(jobTitle) {
        try {
            if (!jobTitle || typeof jobTitle !== 'string') {
                throw new Error('Invalid job title: Job title must be a non-empty string');
            }

            const prompt = `You are an AI interviewer conducting a job interview for the ${jobTitle} position. Start the interview by introducing yourself briefly and asking the first question: "Tell me about yourself and why you're interested in this position." Keep your response concise and professional. This is question 1 of 6.`;
            
            const result = await this.model.generateContent(prompt);
            return {
                response: result.response.text(),
                questionCount: 1
            };
        } catch (error) {
            console.error('Error starting interview:', error);
            throw error;
        }
    }

    async generateResponse(prompt, jobTitle, questionCount) {
        try {
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('Invalid prompt: Prompt must be a non-empty string');
            }

            const nextQuestionCount = questionCount + 1;
            let systemPrompt;

            if (nextQuestionCount <= 6) {
                systemPrompt = `You are an AI interviewer conducting a job interview for the ${jobTitle} position. Based on the candidate's previous response, provide a relevant follow-up question. Focus on questions that assess the candidate's qualifications, experience, and suitability for the ${jobTitle} position. Keep your response concise and professional. This is question ${nextQuestionCount} of 6.`;
            } else {
                systemPrompt = `You are an AI interviewer conducting a job interview for the ${jobTitle} position. The interview is now complete. Based on all the candidate's responses, provide constructive feedback about their interview performance. Include: 
                1. Strengths demonstrated during the interview
                2. Areas for improvement
                3. Specific suggestions for future interviews
                Keep your feedback professional and actionable.`;
            }
            
            const fullPrompt = nextQuestionCount <= 6 
                ? `${systemPrompt}\n\nCandidate's response: ${prompt}\n\nAsk your next question:`
                : `${systemPrompt}\n\nCandidate's final response: ${prompt}\n\nProvide feedback:`;

            const result = await this.model.generateContent(fullPrompt);
            return {
                response: result.response.text(),
                questionCount: nextQuestionCount,
                isComplete: nextQuestionCount > 6
            };
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }
}

module.exports = new GeminiAPI();
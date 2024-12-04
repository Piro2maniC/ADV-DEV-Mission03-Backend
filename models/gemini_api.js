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

    // Helper function to extract JSON from potential markdown response
    extractJSONFromResponse(text) {
        try {
            // Try parsing directly first
            return JSON.parse(text);
        } catch (e) {
            // If direct parsing fails, try to extract JSON from markdown
            const jsonMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    return JSON.parse(jsonMatch[1]);
                } catch (e) {
                    throw new Error('Failed to parse feedback JSON');
                }
            }
            throw new Error('No valid JSON found in response');
        }
    }

    async startInterview(jobTitle) {
        try {
            if (!jobTitle || typeof jobTitle !== 'string') {
                throw new Error('Invalid job title: Job title must be a non-empty string');
            }

            const prompt = `You are an AI interviewer conducting a job interview for the ${jobTitle} position. Start the interview by introducing yourself briefly and asking the first question: "Tell me about yourself and why you're interested in this position." Keep your response concise and professional. This is question 1 of 6.`;
            
            const result = await this.model.generateContent(prompt);
            const firstQuestion = result.response.text();

            return {
                response: firstQuestion,
                questionCount: 1,
                interviewHistory: [{
                    questionNumber: 1,
                    question: firstQuestion,
                    answer: null,
                    feedback: null
                }]
            };
        } catch (error) {
            console.error('Error starting interview:', error);
            throw error;
        }
    }

    async generateResponse(prompt, jobTitle, questionCount, interviewHistory) {
        try {
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('Invalid prompt: Prompt must be a non-empty string');
            }

            const nextQuestionCount = questionCount + 1;
            let systemPrompt;
            let result;

            // Update the previous question's answer in history
            interviewHistory[questionCount - 1].answer = prompt;

            if (nextQuestionCount <= 6) {
                // Generate next question
                systemPrompt = `You are an AI interviewer conducting a job interview for the ${jobTitle} position. Based on the candidate's previous response, provide a relevant follow-up question. Focus on questions that assess the candidate's qualifications, experience, and suitability for the ${jobTitle} position. Keep your response concise and professional. This is question ${nextQuestionCount} of 6.`;
                
                result = await this.model.generateContent(`${systemPrompt}\n\nCandidate's response: ${prompt}\n\nAsk your next question:`);
                const nextQuestion = result.response.text();

                // Generate feedback for the previous answer
                const feedbackPrompt = `Analyze the candidate's response to this interview question and provide specific feedback. Return ONLY a JSON object with exactly this format, no markdown:
                {
                    "strength": "one specific strength from their answer",
                    "improvement": "one specific area for improvement"
                }

                Question: ${interviewHistory[questionCount - 1].question}
                Candidate's response: ${prompt}`;

                const feedbackResult = await this.model.generateContent(feedbackPrompt);
                const feedbackText = feedbackResult.response.text();
                const feedback = this.extractJSONFromResponse(feedbackText);

                interviewHistory[questionCount - 1].feedback = feedback;

                // Add new question to history
                interviewHistory.push({
                    questionNumber: nextQuestionCount,
                    question: nextQuestion,
                    answer: null,
                    feedback: null
                });

                return {
                    response: nextQuestion,
                    questionCount: nextQuestionCount,
                    interviewHistory,
                    isComplete: false
                };
            } else {
                // Generate feedback for the last answer first
                const lastFeedbackPrompt = `Analyze the candidate's response to this interview question and provide specific feedback. Return ONLY a JSON object with exactly this format, no markdown:
                {
                    "strength": "one specific strength from their answer",
                    "improvement": "one specific area for improvement"
                }

                Question: ${interviewHistory[questionCount - 1].question}
                Candidate's response: ${prompt}`;

                const lastFeedbackResult = await this.model.generateContent(lastFeedbackPrompt);
                const lastFeedbackText = lastFeedbackResult.response.text();
                const lastFeedback = this.extractJSONFromResponse(lastFeedbackText);
                interviewHistory[questionCount - 1].feedback = lastFeedback;

                // Generate final comprehensive feedback
                systemPrompt = `You are an AI interviewer providing final feedback for a ${jobTitle} position interview. Review the complete interview history and provide comprehensive feedback. Structure your feedback clearly with bullet points (•) and avoid using any asterisks (*). Keep your response professional and constructive.

                Interview History:
                ${interviewHistory.map(item => `
                Question ${item.questionNumber}: ${item.question}
                Candidate's Answer: ${item.answer}
                Feedback:
                • Strength: ${item.feedback?.strength}
                • Area for Improvement: ${item.feedback?.improvement}
                `).join('\n')}

                Please provide feedback in this exact format:

                Overall Feedback

                Overall Interview Performance Summary:
                [Write a concise paragraph about the candidate's performance, highlighting main strengths and areas needing improvement]

                Key Strengths:

                • Prioritization of [Specific Strength]: [Detailed explanation with specific examples from the interview]
                • Effective [Another Strength]: [Detailed explanation with specific examples]
                • Strong [Another Strength]: [Detailed explanation with specific examples]

                Areas for Improvement:

                • [Main Area] Detail and Specificity: [Detailed explanation with specific examples and suggestions]
                • [Another Area] Skills: [Detailed explanation with specific examples and suggestions]
                • [Another Area]: [Detailed explanation with specific examples and suggestions]

                Note: Use bullet points (•) for all lists and ensure all feedback points include specific examples from the interview.`;
                
                result = await this.model.generateContent(systemPrompt);
                
                return {
                    response: result.response.text(),
                    questionCount: nextQuestionCount,
                    interviewHistory,
                    isComplete: true
                };
            }
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }
}

module.exports = new GeminiAPI();

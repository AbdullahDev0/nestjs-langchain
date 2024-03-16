/**
 * Enum for template strings used in chat interactions.
 *
 * This enum centralizes the templates for different types of chats, providing a
 * uniform approach to structuring the input for AI models.
 *
 * @enum TEMPLATES
 *
 * @member BASIC_CHAT_TEMPLATE - A template for basic chat interactions, instructing
 *                               the AI to provide concise responses as a software
 *                               engineering expert.
 */
export enum TEMPLATES {
  BASIC_CHAT_TEMPLATE = `You are an expert software engineer, give concise response.
   User: {input}
   AI:`,
}

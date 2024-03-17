/**
 * Service for handling Langchain Chat operations.
 *
 * This service is responsible for processing user chat messages by leveraging
 * OpenAI's language models. It transforms the user's input using a prompt template,
 * sends it to the ChatOpenAI model for processing, and then formats the response
 * appropriately before sending it back to the user. The service handles both basic
 * and context-aware chat interactions.
 *
 * @class LangchainChatService
 * @decorator Injectable - Marks the class as a service that can be injected.
 *
 * @method basicChat - Processes a user's chat message using a basic chat template. It
 *                     structures the prompt, sends it to the OpenAI model, and formats
 *                     the output into a human-readable response. Handles errors by
 *                     throwing HttpExceptions.
 *
 * @method contextAwareChat - Processes chat messages considering the context of previous
 *                            interactions. It uses a context-aware template to structure
 *                            the prompt, considering past messages for a more coherent
 *                            and contextually relevant response. Also handles errors
 *                            through HttpExceptions.
 */

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BasicMessageDto } from './dtos/basic-message.dto';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { TEMPLATES } from 'src/utils/constants/templates.constants';
import customMessage from 'src/utils/responses/customMessage.response';
import { MESSAGES } from 'src/utils/constants/messages.constants';
import { openAI } from 'src/utils/constants/openAI.constants';
import { ContextAwareMessagesDto } from './dtos/context-aware-messages.dto';
import { Message as VercelChatMessage } from 'ai';

@Injectable()
export class LangchainChatService {
  async basicChat(basicMessageDto: BasicMessageDto) {
    try {
      const prompt = PromptTemplate.fromTemplate(TEMPLATES.BASIC_CHAT_TEMPLATE);

      const model = new ChatOpenAI({
        temperature: +openAI.BASIC_CHAT_OPENAI_TEMPERATURE,
        modelName: openAI.GPT_3_5_TURBO_1106.toString(),
      });

      const outputParser = new HttpResponseOutputParser();
      const chain = prompt.pipe(model).pipe(outputParser);
      const response = await chain.invoke({
        input: basicMessageDto.user_query,
      });
      return this.successResponse(response);
    } catch (e: unknown) {
      this.exceptionHandling(e);
    }
  }

  async contextAwareChat(contextAwareMessagesDto: ContextAwareMessagesDto) {
    try {
      const prompt = PromptTemplate.fromTemplate(
        TEMPLATES.CONTEXT_AWARE_CHAT_TEMPLATE,
      );

      const messages = contextAwareMessagesDto.messages ?? [];
      const formattedPreviousMessages = messages
        .slice(0, -1)
        .map(this.formatMessage);
      const currentMessageContent = messages[messages.length - 1].content;

      const model = new ChatOpenAI({
        temperature: +openAI.BASIC_CHAT_OPENAI_TEMPERATURE,
        modelName: openAI.GPT_3_5_TURBO_1106.toString(),
      });

      const outputParser = new HttpResponseOutputParser();
      const chain = prompt.pipe(model).pipe(outputParser);
      const response = await chain.invoke({
        chat_history: formattedPreviousMessages.join('\n'),
        input: currentMessageContent,
      });
      return this.successResponse(response);
    } catch (e: unknown) {
      this.exceptionHandling(e);
    }
  }

  private formatMessage = (message: VercelChatMessage) =>
    `${message.role}: ${message.content}`;

  private successResponse = (response: Uint8Array) =>
    customMessage(
      HttpStatus.OK,
      MESSAGES.SUCCESS,
      Object.values(response)
        .map((code) => String.fromCharCode(code))
        .join(''),
    );

  private exceptionHandling = (e: unknown) => {
    Logger.error(e);
    throw new HttpException(
      customMessage(
        HttpStatus.INTERNAL_SERVER_ERROR,
        MESSAGES.EXTERNAL_SERVER_ERROR,
      ),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  };
}

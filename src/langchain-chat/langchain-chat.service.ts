/**
 * Service for handling Langchain Chat operations.
 *
 * This service is responsible for processing user chat messages by leveraging
 * OpenAI's language models. It transforms the user's input using a prompt template,
 * sends it to the ChatOpenAI model for processing, and then formats the response
 * appropriately before sending it back to the user.
 *
 * @class LangchainChatService
 * @decorator Injectable - Marks the class as a service that can be injected.
 *
 * @method chat - Processes a user's chat message. It uses a template to structure
 *                the prompt, sends it to the OpenAI model, and then formats the
 *                output into a human-readable response. In case of errors, it
 *                throws an HttpException with the appropriate status and message.
 */

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BasicMessageDto } from './dtos/basic-message.dto';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { TEMPLATES } from 'src/utils/constants/templates.constants';
import customMessage from 'src/utils/responses/customMessage.response';
import { MESSAGES } from 'src/utils/constants/messages.constants';
import { openAI } from 'src/utils/constants/openAI.constants';

@Injectable()
export class LangchainChatService {
  async chat(basicMessageDto: BasicMessageDto) {
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
      return customMessage(
        HttpStatus.OK,
        MESSAGES.SUCCESS,
        Object.values(response)
          .map((code) => String.fromCharCode(code))
          .join(''),
      );
    } catch (e: unknown) {
      throw new HttpException(
        customMessage(
          HttpStatus.INTERNAL_SERVER_ERROR,
          MESSAGES.EXTERNAL_SERVER_ERROR,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

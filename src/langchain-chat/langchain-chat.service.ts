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

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
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

import { existsSync } from 'fs';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { VectorStoreService } from 'src/services/vector-store.service';
import * as path from 'path';
import { Document } from '@langchain/core/documents';

@Injectable()
export class LangchainChatService {
  constructor(private vectorStoreService: VectorStoreService) {}

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


  async loadPDF() {
    try {
      const file = 'src/pdfs/2312.10997.pdf';
      const resolvedPath = path.resolve(file);
      // Check if the file exists
      if (!existsSync(resolvedPath)) {
        throw new BadRequestException('File does not exist.');
      }

      // Load the PDF using PDFLoader
      const pdfLoader = new PDFLoader(resolvedPath);
      const pdf = await pdfLoader.load();

      // Split the PDF into texts using RecursiveCharacterTextSplitter
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 50,
      });
      const texts = await textSplitter.splitDocuments(pdf);
      let embeddings: Document[] = [];

      for (let index = 0; index < texts.length; index++) {
        const page = texts[index];
        const splitTexts = await textSplitter.splitText(page.pageContent);
        const pageEmbeddings = splitTexts.map((text) => ({
          pageContent: text,
          metadata: {
            pageNumber: index,
          },
        }));
        embeddings = embeddings.concat(pageEmbeddings);
      }
      await this.vectorStoreService.addDocuments(embeddings);

      return await this.vectorStoreService.similaritySearch('naive rag', 3);
    } catch (e: unknown) {
      console.log(e);

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

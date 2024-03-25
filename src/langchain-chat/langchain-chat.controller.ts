/**
 * Controller for Langchain Chat operations.
 *
 * Handles HTTP requests for basic, context-aware, and document-context chat interactions,
 * and for uploading documents in the Langchain application. This controller is responsible for
 * validating incoming request data and orchestrating chat interactions through the LangchainChatService.
 * It supports endpoints for initiating basic chat, context-aware chat, uploading documents (specifically PDFs),
 * and conducting chats with document context, ensuring a versatile chat service experience.
 *
 * @class LangchainChatController
 *
 * @method basicChat - Initiates a basic chat interaction. Accepts POST requests with a BasicMessageDto to capture the user's message.
 *                     Processes the chat through LangchainChatService.
 * @param {BasicMessageDto} messagesDto - DTO for the user's message.
 * @returns Processed chat response from the LangchainChatService.
 *
 * @method contextAwareChat - Initiates a context-aware chat interaction. Accepts POST requests with a ContextAwareMessagesDto to manage chat context.
 *                            Leverages LangchainChatService for processing.
 * @param {ContextAwareMessagesDto} contextAwareMessagesDto - DTO for managing chat context.
 * @returns Contextual chat response from the LangchainChatService.
 *
 * @method loadPDF - Handles the uploading of a PDF document. Utilizes FileInterceptor for handling file uploads and processes the uploaded PDF through LangchainChatService.
 * @param {DocumentDto} documentDto - DTO for the document information, adjusted to include the uploaded file's name.
 * @param {Express.Multer.File} file - Uploaded file object.
 * @returns Response from the LangchainChatService after processing the uploaded PDF.
 *
 * @method documentChat - Initiates a document-context chat interaction. Accepts POST requests with a BasicMessageDto, using document context for enriched chat responses.
 *                        Processes the chat through LangchainChatService.
 * @param {BasicMessageDto} messagesDto - DTO for the user's message.
 * @returns Document-contextual chat response from the LangchainChatService.
 *
 * This controller uses decorators to define routes and their configurations, ensuring proper request handling and response formatting. It also integrates file upload handling for PDF documents, enabling document-context chat functionalities.
 */

import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LangchainChatService } from './langchain-chat.service';
import { BasicMessageDto } from './dtos/basic-message.dto';
import { ContextAwareMessagesDto } from './dtos/context-aware-messages.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { DocumentDto } from './dtos/document.dto';
import { diskStorage } from 'multer';
import { PDF_BASE_PATH } from 'src/utils/constants/common.constants';

@Controller('langchain-chat')
export class LangchainChatController {
  constructor(private readonly langchainChatService: LangchainChatService) {}

  @Post('basic-chat')
  @HttpCode(200)
  async basicChat(@Body() messagesDto: BasicMessageDto) {
    return await this.langchainChatService.basicChat(messagesDto);
  }

  @Post('context-aware-chat')
  @HttpCode(200)
  async contextAwareChat(
    @Body() contextAwareMessagesDto: ContextAwareMessagesDto,
  ) {
    return await this.langchainChatService.contextAwareChat(
      contextAwareMessagesDto,
    );
  }

  @Post('upload-document')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: PDF_BASE_PATH,
        filename: (req, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @HttpCode(200)
  async loadPDF(
    @Body() documentDto: DocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file.filename) {
      documentDto.file = file.filename;
    }
    return await this.langchainChatService.uploadPDF(documentDto);
  }

  @Post('document-chat')
  @HttpCode(200)
  async documentChat(@Body() messagesDto: BasicMessageDto) {
    return await this.langchainChatService.documentChat(messagesDto);
  }

  @Post('agent-chat')
  @HttpCode(200)
  async agentChat(@Body() contextAwareMessagesDto: ContextAwareMessagesDto) {
    return await this.langchainChatService.agentChat(contextAwareMessagesDto);
  }
}

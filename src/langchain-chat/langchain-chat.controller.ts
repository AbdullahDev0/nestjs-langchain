/**
 * Controller for Langchain Chat operations.
 *
 * This controller handles HTTP requests related to basic chat interactions in the
 * Langchain application. It primarily deals with receiving and processing user
 * messages through the LangchainChatService. The controller ensures that the
 * incoming request data is properly structured and validated.
 *
 * @class LangchainChatController
 * @decorator Controller - Defines the base route ('/langchain-chat') for all endpoints in this controller.
 *
 * @method chat - Endpoint for initiating a basic chat. It accepts a POST request with a
 *                BasicMessageDto object, representing the user's message, and uses
 *                LangchainChatService for processing the chat interaction.
 */
import { Body, Controller, Post } from '@nestjs/common';
import { LangchainChatService } from './langchain-chat.service';
import { BasicMessageDto } from './dtos/basic-message.dto';

@Controller('langchain-chat')
export class LangchainChatController {
  constructor(private readonly langchainChatService: LangchainChatService) {}

  @Post('basic-chat')
  async chat(@Body() messagesDto: BasicMessageDto) {
    return await this.langchainChatService.chat(messagesDto);
  }
}

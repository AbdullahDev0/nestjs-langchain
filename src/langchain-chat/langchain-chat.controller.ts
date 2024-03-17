/**
 * Controller for Langchain Chat operations.
 *
 * This controller handles HTTP requests related to basic chat interactions in the
 * Langchain application. It primarily deals with receiving and processing user
 * messages through the LangchainChatService. The controller ensures that the
 * incoming request data is properly structured and validated, and handles both
 * basic and context-aware chat interactions.
 *
 * @class LangchainChatController
 * @decorator Controller - Defines the base route ('/langchain-chat') for all endpoints in this controller.
 *
 * @method basicChat - Endpoint for initiating a basic chat. It accepts a POST request with a
 *                     BasicMessageDto object, representing the user's message, and uses
 *                     LangchainChatService for processing the chat interaction.
 *
 * @method contextAwareChat - Endpoint for initiating a context-aware chat. It accepts a POST request with a
 *                            ContextAwareMessagesDto object, allowing the incorporation of context into the
 *                            chat conversation, and uses LangchainChatService for processing.
 */

import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LangchainChatService } from './langchain-chat.service';
import { BasicMessageDto } from './dtos/basic-message.dto';
import { ContextAwareMessagesDto } from './dtos/context-aware-messages.dto';

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
}

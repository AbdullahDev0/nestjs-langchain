import { Module } from '@nestjs/common';
import { LangchainChatService } from './langchain-chat.service';
import { LangchainChatController } from './langchain-chat.controller';
import { VectorStoreService } from 'src/services/vector-store.service';

@Module({
  controllers: [LangchainChatController],
  providers: [LangchainChatService, VectorStoreService],
})
export class LangchainChatModule {}

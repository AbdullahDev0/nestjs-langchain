import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LangchainChatModule } from './langchain-chat/langchain-chat.module';

@Module({
  imports: [ConfigModule.forRoot(), LangchainChatModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

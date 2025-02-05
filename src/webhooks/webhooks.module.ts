import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [WebhooksController],
  providers: [UsersService],
})
export class WebhooksModule {}

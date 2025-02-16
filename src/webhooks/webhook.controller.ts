import {
  Controller,
  Post,
  Headers,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { Webhook } from 'svix';
import { UserWebhookEvent } from '@clerk/clerk-sdk-node';
import { UsersService } from 'src/users/users.service';

@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly webhook: Webhook;
  constructor(private readonly usersService: UsersService) {
    this.webhook = new Webhook(process.env.SIGNING_SECRET!);
  }

  @Post()
  async handleUserWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Req() req: any,
  ): Promise<{ success: boolean; message: string }> {
    const payload = req.rawBody;

    let evt: UserWebhookEvent;

    try {
      evt = this.webhook.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as UserWebhookEvent;
    } catch (err) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }

    switch (evt.type) {
      case 'user.created':
        await this.usersService.createUser(evt.data);
        break;
      case 'user.updated':
        await this.usersService.updateUser(evt.data);
        break;
      case 'user.deleted':
        await this.usersService.deleteUser(evt.data);
        break;
    }

    return { success: true, message: 'Webhook verified and processed' };
  }
}

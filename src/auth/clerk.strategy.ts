import { verifyToken } from '@clerk/backend';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';
import {
  InvalidTokenException,
  NoTokenProvidedException,
} from 'src/common/exceptions/auth.exceptions';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super();
  }

  async validate(req: Request) {
    const token = req.headers.authorization?.split(' ').pop();

    if (!token) {
      throw new NoTokenProvidedException();
    }

    try {
      const tokenPayload = await verifyToken(token, {
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
      });
      const userId = tokenPayload.sub;

      const user = await this.usersService.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new Error();
      }
      return userId;
    } catch {
      throw new InvalidTokenException();
    }
  }
}

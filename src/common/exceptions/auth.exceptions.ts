import { UnauthorizedException } from '@nestjs/common';

export class NoTokenProvidedException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'No token provided',
      code: 'no_token_provided',
    });
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid token',
      code: 'invalid_token',
    });
  }
}

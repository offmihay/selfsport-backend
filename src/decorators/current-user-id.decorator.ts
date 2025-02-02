import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    const errorType = exceptionResponse?.error || 'Error';
    const message = exceptionResponse?.message || 'Something went wrong';
    const code = exceptionResponse?.code || HttpStatus[status] || 500;

    response.status(status).json({
      statusCode: status,
      error: errorType,
      message: message,
      code: code,
    });
  }
}

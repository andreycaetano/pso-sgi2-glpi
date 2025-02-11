import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof AxiosError
        ? exception.status
        : 500;
    
        
        

    const message =
      exception instanceof AxiosError
        ? exception.response.data
        : 'Internal server error';

    this.logger.error(
      `Error: ${status} | ${request.method} ${request.url} | Message: ${
        (exception as AxiosError).response.data || exception
      }`
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}

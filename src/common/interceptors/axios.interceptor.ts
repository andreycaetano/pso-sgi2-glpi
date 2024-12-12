import axios, { AxiosError } from 'axios';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable } from 'rxjs';

@Injectable()
export class AxiosInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      catchError((error) => {
        console.log(error);

        if (error.isAxiosError) {
          const AxiosError = error as AxiosError;

          throw new HttpException(
            {
              statusCode: AxiosError.response?.status || HttpStatus.BAD_REQUEST,
              message: AxiosError.response?.data || 'External API error',
              error: AxiosError.response?.statusText,
            },
            AxiosError.response?.status || HttpStatus.BAD_REQUEST,
          );
        }
        throw error;
      }),
    );
  }
}

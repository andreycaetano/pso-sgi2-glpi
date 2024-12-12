import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AxiosInterceptor } from './common/interceptors/axios.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new AxiosInterceptor())

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

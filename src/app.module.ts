import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, UserModule, ConfigModule.forRoot({
    isGlobal: true
  })],
  controllers: [],
  providers: [AuthService],
})
export class AppModule {}

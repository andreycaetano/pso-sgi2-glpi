import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';  // Caminho para o seu AuthService

@Injectable()
export class UpdateTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const sessionToken = await this.authService.getSessionToken();

    request.headers['session-token'] = sessionToken;

    return true;
  }
}

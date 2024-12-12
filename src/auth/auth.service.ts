import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(private readonly httpService: HttpService) {};

  private baseUrl = process.env.GLPI_URL;
  private headers = {
            'Content-Type': 'application/json',
            'Authorization': `user_token ${process.env.GLPI_USER_TOKEN}`,
            'App-Token': `${process.env.GLPI_APP_TOKEN}`
  }

  async getSessionToken(): Promise<any> {
    const url = `${this.baseUrl}/initSession?get_full_session=true`;

    try {
      const { data } = await lastValueFrom(
        this.httpService.get(url, { headers: this.headers })
      );
      
      return data.session_token;
    } catch (error) {
      console.error('Erro ao chamar a API:', error.response?.data || error.message);
      throw new Error('Erro ao iniciar sessão');
    }
  }
}

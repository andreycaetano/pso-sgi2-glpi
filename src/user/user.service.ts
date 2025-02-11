import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpService,
  ) {}

  private baseUrl = process.env.GLPI_URL;

  private async getRequestGlpiHeaders() {
    const sessionToken: string = await this.authService.getSessionToken();

    return {
      'App-Token': process.env.GLPI_APP_TOKEN,
      'Session-Token': sessionToken,
      'Content-Type': 'application/json',
    };
  }

  capitalizarPrimeiraLetra(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  async create(createUserDto: CreateUserDto) {
    const headers = await this.getRequestGlpiHeaders();
    const hash = crypto.createHash('sha1');
    hash.update(createUserDto.password);

    const nomePartes = createUserDto.nome.split(' ');

    const { data } = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/User`,
        {
          input: {
            name: createUserDto.email,
            firstname: this.capitalizarPrimeiraLetra(nomePartes[0]),
            realname: nomePartes
              .slice(1)
              .map((nome) => this.capitalizarPrimeiraLetra(nome))
              .join(' '),
            password: hash.digest('hex'),
            is_active: 1,
            _profiles_id: 1,
            _entities_id: 1,
            _is_recursive: 0
          },
        },
        { headers },
      ),
    );

    await this.registrarUsuarioEmEntidades(data.id);
    await this.registrarEmail(createUserDto.email, data.id);
    await this.registrarUsuarioEmSetor(createUserDto.setor, data.id);

    return data.data;
  }

  private async buscarUsuario(email: string) {
    const headers = await this.getRequestGlpiHeaders();

    const params = {
      'criteria[0][link]': 'AND',
      'criteria[0][itemtype]': 'User',
      'criteria[0][field]': 5,
      'criteria[0][searchtype]': 'contains',
      'criteria[0][value]': email,
      forcedisplay: 2,
    };

    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/search/User/`, { params, headers }),
    );

    return data;
  }

  private async buscarSetor(setor: string) {
    const headers = await this.getRequestGlpiHeaders();
    const params = {
      'criteria[0][link]': 'AND',
      'criteria[0][itemtype]': 'Group',
      'criteria[0][field]': 1,
      'criteria[0][searchtype]': 'contains',
      'criteria[0][value]': setor,
      forcedisplay: 2,
    };

    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/search/Group`, { params, headers }),
    );

    if (data.totalcount <= 0)
      throw new NotFoundException('Setor não encontrado');

    return {
      id: data.data[0]['2'],
      nome: data.data[0]['1'],
      entidade: data.data[0]['80'],
    };
  }

  private async buscarEmail(email: string) {
    const headers = await this.getRequestGlpiHeaders();

    const getEmails = await firstValueFrom(
      this.http.get(`${this.baseUrl}/UserEmail`, { headers }),
    );
    return getEmails.data.find((mail) => mail.email === email);
  }

  private async registrarEmail(email: string, userId: number): Promise<void> {
    const headers = await this.getRequestGlpiHeaders();
    const findEmail = await this.buscarUsuario(email);
    if (findEmail.totalcount > 0)
      throw new ConflictException('Email ja cadastrado');

    const { data } = await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/UserEmail`,
        {
          input: {
            users_id: userId,
            email,
          },
        },
        { headers },
      ),
    );
  }

  private async registrarUsuarioEmSetor(nmSetor: string, userId: number) {
    const headers = await this.getRequestGlpiHeaders();
    const setor = await this.buscarSetor(nmSetor);

    await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/Group_User`,
        {
          input: {
            users_id: userId,
            groups_id: setor.id,
          },
        },
        { headers },
      ),
    );
  }

  async atualizarUsuario(email: string, updateUserDto: UpdateUserDto) {
    const headers = await this.getRequestGlpiHeaders();

    const user = await this.buscarUsuario(email);

    if (updateUserDto.is_active === 0 || updateUserDto.is_active === 1) {
      const { data } = await firstValueFrom(
        this.http.put(
          `${this.baseUrl}/User/${String(user.data[0]['2'])}`,
          {
            input: {
              is_active: updateUserDto.is_active,
            },
          },
          { headers },
        ),
      );
    } else if (updateUserDto.email) {
      const userEmail = await this.buscarEmail(email);
      console.log(userEmail);

      await firstValueFrom(
        this.http.patch(
          `${this.baseUrl}/UserEmail/${userEmail.id}`,
          {
            input: {
              name: updateUserDto.email,
              email: updateUserDto.email,
            },
          },
          { headers },
        ),
      );
    }
    return {
      id: user.data[0]['2'],
      message: 'Usuario atualizado com sucesso',
    };
  }

  private async registrarUsuarioEmEntidades(id: number) {
    const headers = await this.getRequestGlpiHeaders();

    await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/Profile_User`,
        {
          input: {
            users_id: id,
            profiles_id: 1,
            entities_id: 2,
            is_recursive: 0,
          },
        },
        { headers },
      ),
    );
    await firstValueFrom(
      this.http.post(
        `${this.baseUrl}/Profile_User`,
        {
          input: {
            users_id: id,
            profiles_id: 1,
            entities_id: 3,
            is_recursive: 0,
          },
        },
        { headers },
      ),
    );
  }

  
}

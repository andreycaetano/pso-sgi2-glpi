import { IsEmail, IsNumber, IsString, Max, Min } from "class-validator";

export class CreateUserDto {
  @IsString({ message: 'Primeiro nome é obrigatorio' })
  nome: string;

  @IsString({ message: 'Email é obrigatorio' })
  @IsEmail()
  email: string;

  @IsString({ message: 'Nome do setor é obrigatorio' })
  setor: string;

  @Min(0, { message: 'is_active valor minimo 0' })
  @Max(1, { message: 'is_active valor maximo 1' })
  @IsNumber()
  is_active: number;

  @IsString({ message: 'Senha é obrigatorio'})
  password: string;
}

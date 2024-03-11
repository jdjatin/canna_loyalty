import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jatin.13deswal@gmail.com', description: 'These is broker/manager credentials' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123#'})
  @IsNotEmpty()
  password: string;
}

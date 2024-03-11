import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { CompleteProfile } from './auth/entities/completeProfile.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { User } from './users/entities/user.entity';
import { UserProfile } from './users/entities/user_profile.entity';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10), // Convert string to number
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD, // Ensured to be a string through environment
      database: process.env.DB_NAME,
      entities: [User,UserProfile,CompleteProfile,RefreshToken], // You should list your entities here
      migrations: ['./migrations/*.js'],
      synchronize: false
    }),
    AuthModule, MailModule, UsersModule, PassportModule],

  controllers: [AppController],
  providers: [AppService],

})
export class AppModule {}

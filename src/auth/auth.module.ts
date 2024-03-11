/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt/dist';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { AuthController } from './controllers/auth/auth.controller';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { AuthService } from './services/auth/auth.service';
import { CompleteProfile } from './entities/completeProfile.entity';
import { MulterModule } from '@nestjs/platform-express';
import { UserDocs } from './entities/userDocs.entity';
import { UserProfile } from '../users/entities/user_profile.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([User, RefreshToken, CompleteProfile,UserDocs,UserProfile]),
    MulterModule.register({
      dest: 'uploads/', // Destination folder
    }),
   
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '3600s' },
    }),MailModule,
    // AppModule
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, MailService],
})
export class AuthModule {}

/* eslint-disable prettier/prettier */
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MailService {
  constructor(
    private readonly configService: ConfigService,
    private mailerService: MailerService,
  ) {
    // SendGrid.setApiKey(process.env.sendGrid_Key);   //causing issue after turning esModuleInterop flag true in tsconfig (for razorpay)

  }


  async sendUserConfirmation(user: User, token: string) {
    const url = `${process.env.APP_URL}api/auth/confirm?token=${token}`;
    // await SendGrid.send(mail);
    this.mailerService.sendMail({
      to: user.email,
      // from: process.env.MAIL_FROM,
      from: "jatin.13deswal@gmail.com",
      subject: 'Welcome to CannaLoyalty App! Confirm your Email',
      template: './emailVerification', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.firstName,
        url,
      },
    })
      .then((success) => {
        return true
      })
      .catch((err) => {
        console.log(err)
      });
  }


  // default to send mails
  async sendMail(data) {
    try {
      this.mailerService.sendMail({
        to: data.email,
        from: "jatin@masterinfotech.com", // override default from
        subject: data.subject,
        template: "./passwordToken", // `.hbs` extension is appended automatically
        context: { ...data },
      });
    } catch (error) {
      throw error;
    }

  }

}

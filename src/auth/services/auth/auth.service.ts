/* eslint-disable prettier/prettier */
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import 'path';

import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { MailService } from '../../../mail/mail.service';
import { completeProfileDto } from '../../dto/completeProfile.dto';
import { CompleteProfile } from '../../entities/completeProfile.entity';
import { Twilio } from "twilio";
import { UserDocs } from '../../entities/userDocs.entity';
import path from 'path';
// import * as AWS from 'aws-sdk';
// import { ManagedUpload } from 'aws-sdk/clients/s3';
import { UserProfile } from '../../../users/entities/user_profile.entity';

@Injectable()
export class AuthService {
    // private readonly client:Twilio;
    // private readonly s3: AWS.S3;
    // private readonly bucketName: string = 'docs-mt5';
    constructor(
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        @InjectRepository(CompleteProfile)
        private readonly userProfile: Repository<CompleteProfile>,
        @InjectRepository(UserDocs)
        private readonly userDocs: Repository<UserDocs>,
        @InjectRepository(UserProfile)
        private readonly userRepo: Repository<UserProfile>


    ) {
        // const accountSid = process.env.TWILIO_SID;
        // const authToken = process.env.TWILIO_TOKEN;
        // this.client = new Twilio(accountSid, authToken);
    }


    async createUser(userData: any) {
        try {
            const email = userData.email;
            const findUser = await this.userRepository.findOne({
                where: {
                    email: email.toLowerCase(),
                },
            }); console.log(findUser,"finduser")
            if (!findUser) {
                const res = await this.userRepository.save(
                    {
                        ...userData,
                        email: userData.email.toLowerCase(),
                        firstName: userData.firstName.trim(),
                        lastName: userData.lastName.trim(),
                        password: await bcrypt.hash(userData.password, 10),
                        token: userData.token,
                        // profile: {},
                    },
                    { transaction: true },
                );
    
    
                await this.userProfile.save({
                    userId: res.id,
                    // Set other default values here
                    // company: '',
                    // phone: '',
                    // country: '',
                    // zipCode: 0,
                    // state: '',
                    // city: '',
                    // address: '',
                    // symbols: { symbols: [] },
                    // ...Object.fromEntries(
                    //     Object.keys(this.userProfile.metadata.propertiesMap).map((key) => [key, null])
                    //   ),
                });
    
                if (res) {
                    delete res.token;
                    return res;
                }
                throw new UnprocessableEntityException('Unable to create account!');
            }
            throw new UnprocessableEntityException('Email already exist');
        } catch (error) {
            throw error;
        }

    }



    async updateRefreshToken(refreshToken, expirydate, payload) {
        await this.refreshTokenRepository.upsert(
            {
                userId: payload.id,
                refreshToken: refreshToken,
                refreshTokenExpires: expirydate,
            },
            ['userId'],
        );
    }

    async generateRefreshToken(payload) {
        try {
            const expirydate = new Date();

            expirydate.setDate(
                expirydate.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRY),
            );

            const salt = await bcrypt.genSalt();
            const refreshToken = await bcrypt.hash(JSON.stringify(payload), salt);

            this.updateRefreshToken(refreshToken, expirydate, payload);

            return refreshToken;
        }
        catch (error) {
            return error;
        }
    }



    async getProfile(userId) {
        const profile = await this.userRepository.findOne({
            where: { id: userId }, select: ['id', 'firstName', 'lastName', 'isActive', 'role']
        });
        const info = await this.userProfile.findOne({ where: { userId: userId }, select: ['DOB','PhoneNumber','isEligible','created_at'] })
        console.log(info);
        const result = { ...profile, ...info }
        return result;
    }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { email: email },
        });
        if (user) {
            if (await bcrypt.compare(password, user.password)) {
                return user;
            } else {
                throw new UnauthorizedException({
                    code: 1,
                    error: 'Please check your login credentials',
                });
            }
        }
        throw new HttpException(
            {
                statusCode: 404,
                message: 'No user found with this email!',
                data: []
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    async forgotPassword(data) {
        const randomToken = String(Math.floor(1000 + Math.random() * 9000));
        let user = await this.userRepository.findOne({
            where: { email: data.email },
        });
        if (user) {

            await this.userRepository.update({ id: user.id }, { token: randomToken });
            const mailData = {
                ...user,
                token: randomToken,
                email: user.email,
                subject: 'Reset Password',
            };
            await this.mailService.sendMail(mailData);
            return { message: 'OTP sent to your mail' };
        }
        throw new NotFoundException('No User found with this email');
    }

    async login(user) {
        try {
            let payload = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                // role: user.role
            };

            return {
                userId: user.id,
                accessToken: this.jwtService.sign(payload),
                refreshToken: await this.generateRefreshToken(payload),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                // role: user.role
            };
        }
        catch (error) {
            return error;
        }
    }

    async verify(id: string) {
        const isVerified = await this.userRepository.update(
            { token: id },
            { isVerified: true },
        );
        if (!!isVerified) {
            return true;
        }
        return false;
    }

    async completeProfile(userInfo: completeProfileDto, user) {
        try {

            // Create or update the 'CompleteProfile' entity
            let userProfile = await this.userProfile.findOne({ where: { userId: user.userId } });

            if (!userProfile) {
                userProfile = new CompleteProfile();
                userProfile.userId = user.userId;
            }

            // Update the 'CompleteProfile' entity
            userProfile.DOB = userInfo.DOB;
            userProfile.PhoneNumber = userInfo.phoneNumber;

            await this.userProfile.save(userProfile);

            // Return the updated user and profile data
            return {
                DOB: userProfile.DOB,
                phoneNumber:userProfile.PhoneNumber
            };

        } catch (error) {
            throw error;
        }

    }


    async updateProfile(userId, userInfo) {

        let profileRecord = await this.userProfile.findOne({ where: { 'userId': userId.userId } });

        if (!profileRecord) {
            throw new NotFoundException('User profile not found');
        };

        profileRecord.DOB = userInfo.DOB;
        profileRecord.PhoneNumber = userInfo.phoneNumber

        console.log(profileRecord);
        const res1 = await this.userProfile.save(profileRecord)

        return res1;

    }



    async handleFile(file, user, doctype) {
        try {
            const fileInfo = new UserDocs();
            const userid = user.userId;
            fileInfo.userId = userid;
            fileInfo.document_type = doctype.document_type;
            fileInfo.original_name = file.originalname;
            fileInfo.path = `${process.env.STATIC_PATH}/${file.path}`
            return await this.userDocs.save(fileInfo);
        } catch (error) {
            throw error;
        }

    }

    async deleteFiles(user) {
        // Delete existing records for the same userId
        return await this.userDocs.delete({ userId: user.userId });
    }

    async getDocuments(userId) {
        const query = `
        SELECT  document_type, 
        CONCAT('https://trade.masterinfotech.com/api/auth/certificates/', original_name) AS document_url
        FROM user_docs
        WHERE "userId" = $1`;
        const results = await this.userDocs.query(query, [userId]);
        return results;
    }

    // async uploadFiles(files: any[], folderName: string): Promise<string[]> {
    //     const uploadPromises: Promise<ManagedUpload.SendData>[] = [];

    //     for (const file of files) {
    //         const fileName = file.originalname;
    //         const fileStream = file.buffer;
    //         const keyName = folderName ? `${folderName}/${fileName}` : fileName;

    //         const params: AWS.S3.PutObjectRequest = {
    //           Bucket: this.bucketName,
    //           Key: keyName,
    //           Body: fileStream,
    //           ContentType: file.mimetype,
    //           ACL: 'public-read',
    //         };

    //         try {
    //           const uploadResult: ManagedUpload.SendData = await this.s3.upload(params).promise();
    //           const s3ObjectUrl = uploadResult.Location;

    //           // Save file info to the database
    //           const fileInfo = new UserDocs();
    //           fileInfo.userId = user.userId;
    //           fileInfo.document_type = doctype.document_type;
    //           fileInfo.original_name = fileName;
    //           fileInfo.path = s3ObjectUrl; // Update with the correct path
    //           const savedFileInfo = await this.userRepository.save(fileInfo);

    //           uploadedUrls.push(savedFileInfo.path); // Store the saved URL
    //         } catch (error) {
    //           console.error('Failed to upload file to S3:', error);
    //           // Handle the error appropriately
    //         }
    //       }

    //       return uploadedUrls;
    //     }






}

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from "./app.module";
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv'
import { useContainer } from 'class-validator';
import { warn } from 'console';
import * as session from 'express-session';


declare const module: any;
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: "*",
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe());
  //  app.connectMicroservice({
  //   transport: Transport.TCP,
  //   options: {
  //     host: 'localhost',
  //     port: 4000
  //   }
  // })
  await app.startAllMicroservices();

  app.use(
    session({
      name: 'NESTJS_SESSION',
      secret: process.env.SESSION_KEY,
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Canna Loyalty App')
    .setDescription('The Cannabis App Api Description')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(3000);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  Logger.log("Listening on 3000");
  console.log('App Gateway Running on Port: 3000');

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
dotenv.config();
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { Env, parseOrigins } from './config/env.validation';

export const setupApp = (app: INestApplication) => {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: parseOrigins(config.get('CORS_ORIGINS', { infer: true })),
    methods: 'GET,HEAD,POST,PATCH,DELETE',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
};

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const port = config.get('PORT', { infer: true });

  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('SplitPal API')
        .setDescription(
          'Shared expenses: OTP login, groups, expenses, balances, settle up and offline sync. ' +
            'Amounts are integers in minor units (12500 = 12.500 TND).',
        )
        .setVersion('1.0')
        .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          'access_token',
        )
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(`SplitPal API listening on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();

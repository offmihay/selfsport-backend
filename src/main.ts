import { config } from 'dotenv';

// Order of the config method invocation is important, it SHOULD BE BEFORE any other modules import lines
// This ensure env variables are injected before any other modules loaded. Otherwise there might be delay in
// injecting these variables to other modules if ConfigService is used due to its asynchronous injection nature.
// eg: Cloudinary need CLOUDINARY_URL to be present when storage is initialized. But when initialized outside
// controller or service, the env variable might not be present during invocation. eg: categories.controller.ts
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

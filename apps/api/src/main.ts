import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const PREFIX = "api";
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(PREFIX);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

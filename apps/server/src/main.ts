import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { corsConfig } from './cors.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  app.enableCors({
    ...corsConfig,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  const httpApp = app.getHttpAdapter();
  httpApp.get('/health', (_req: any, res: any) => { res.status(200).json({ status: 'ok' }); });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Battle Jets server running on port ${port}`);
}

bootstrap();

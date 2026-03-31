import { HttpExceptionFilter } from '@api/common/filters/http-exception.filter';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  // Disable NestJS built-in body parser — registered manually below (Express 5 compat)
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const config = app.get<import('@nestjs/config').ConfigService>((await import('@nestjs/config')).ConfigService);

  const env = config.get<string>('NODE_ENV', 'development');
  const port = config.get<number>('PORT', 3001);
  const corsOrigins = config
    .get<string>('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  // Body parser — DoS protection, manually registered for Express 5 compat
  app.use(bodyParser.json({ limit: '100kb' }));
  app.use(bodyParser.urlencoded({ limit: '100kb', extended: true }));

  app.use(helmet());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TalentLens API')
      .setVersion('1.0.0')
      .setDescription('AI-powered candidate profile analysis API')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));
  }

  await app.listen(port);

  const base = `http://localhost:${port}`;
  console.log(`\n🚀 TalentLens API`);
  console.log(`   REST API  →  ${base}`);
  if (env !== 'production') {
    console.log(`   Swagger   →  ${base}/docs`);
    console.log(`   OpenAPI   →  ${base}/docs-json\n`);
  }
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('TalentLens API')
    .setVersion('1.0.0')
    .setDescription('AI-powered candidate profile analysis API')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const cleaned = cleanupOpenApiDoc(document);

  const outputPath = path.resolve(__dirname, '../openapi.yaml');
  fs.writeFileSync(outputPath, yaml.dump(cleaned, { lineWidth: 120 }));

  console.log(`✅ openapi.yaml generated at ${outputPath}`);
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Failed to export OpenAPI spec:', err);
  process.exit(1);
});

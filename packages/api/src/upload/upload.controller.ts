import { Controller, HttpCode, HttpStatus, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadResponseDto } from './dto/upload-response.dto';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class import for injection token
import { UploadService } from './upload.service';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'uploadFiles', summary: 'Upload candidate PDF files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cv'],
      properties: {
        cv: { type: 'string', format: 'binary', description: 'CV / Resume (required)' },
        letter: { type: 'string', format: 'binary', description: 'Cover letter (optional)' },
        linkedin: { type: 'string', format: 'binary', description: 'LinkedIn PDF export (optional)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Files processed', type: UploadResponseDto })
  @ApiResponse({ status: 422, description: 'Validation error' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cv', maxCount: 1 },
        { name: 'letter', maxCount: 1 },
        { name: 'linkedin', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } },
    ),
  )
  async uploadFiles(
    @UploadedFiles()
    files: { cv?: Express.Multer.File[]; letter?: Express.Multer.File[]; linkedin?: Express.Multer.File[] },
  ) {
    return this.uploadService.processFiles(files);
  }
}

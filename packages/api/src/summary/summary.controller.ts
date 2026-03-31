import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { SummaryRequestDto } from './dto/summary-request.dto';
import { SummaryResponseDto } from './dto/summary-response.dto';
// biome-ignore lint/style/useImportType: NestJS DI requires runtime class import for injection token
import { SummaryService } from './summary.service';

@ApiTags('summary')
@Controller('summary')
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'generateSummary', summary: 'Generate a structured candidate summary' })
  @ApiResponse({ status: 200, description: 'Structured candidate summary', type: SummaryResponseDto })
  @ApiResponse({ status: 422, description: 'Validation error' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  async generateSummary(@Body() dto: SummaryRequestDto): Promise<SummaryResponseDto> {
    return this.summaryService.generateSummary(dto);
  }
}

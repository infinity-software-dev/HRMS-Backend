import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/app/holidays')
@UseGuards(JwtAuthGuard)
export class HolidayAppController {
  constructor(private readonly holidayService: HolidayService) {}

  // e.g., GET /api/app/holidays?year=2026
  @Get()
  async findAll(@Query('year', ParseIntPipe) year: number) {
    const data = await this.holidayService.findAllByYear(year);
    return { success: true, data };
  }
}

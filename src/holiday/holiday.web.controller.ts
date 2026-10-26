import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/web/holidays')
@UseGuards(JwtAuthGuard)
export class HolidayWebController {
  constructor(private readonly holidayService: HolidayService) { }

  // e.g., GET /api/web/holidays?year=2026
  @Get()
  async findAll(@Query('year', ParseIntPipe) year: number) {
    const data = await this.holidayService.findAllByYear(year);
    return { success: true, data };
  }
}
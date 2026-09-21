import { Controller, Get, Post, Body } from '@nestjs/common';
import { PositionService } from './position.service';

@Controller('position')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}
}

import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MailService } from './mail.service';
import type { Express } from 'express';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) { }

  @Post('send-letter')
  @UseInterceptors(FileInterceptor('file'))
  async sendLetter(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string,
    @Body('subject') subject?: string,
    @Body('text') text?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    if (!email) {
      throw new BadRequestException('Recipient email is required.');
    }

    return this.mailService.sendLetterEmail(
      email,
      file.originalname || 'Document.pdf',
      file.buffer,
      subject,
      text,
    );
  }
}

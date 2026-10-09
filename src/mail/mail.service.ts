import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor() {
    // Make sure to add RESEND_API_KEY to your backend .env file!
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_your_api_key_here');
  }

  async sendLetterEmail(toEmail: string, filename: string, fileBuffer: Buffer, subject?: string, text?: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        // Using the verified domain infinityarthvishva.com
        from: 'Infinity Arthvishva <hr@infinityarthvishva.com>',
        to: toEmail,
        replyTo: 'hr@infinityarthvishva.com',
        bcc: 'hr@infinityarthvishva.com',
        subject: subject || 'Important Letter from Infinity Arthvishva',
        html: `<p>${(text || 'Please find your letter attached to this email.').replace(/\n/g, '<br/>')}</p>`,
        attachments: [
          {
            filename: filename,
            content: fileBuffer,
          },
        ],
      });

      if (error) {
        console.error('Resend API Error:', error);
        throw new Error(error.message);
      }

      return { success: true, message: 'Email sent successfully!', data };
    } catch (error) {
      console.error('Error sending email with Resend:', error);
      throw new InternalServerErrorException('Failed to send email.');
    }
  }
}
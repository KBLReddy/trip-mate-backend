import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule], // Import ConfigModule to access environment variables
  providers: [MailService],
  exports: [MailService], // Export MailService to use in other modules
})
export class MailModule {}
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    // Create transporter with configuration from environment variables
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });

    // Verify transporter configuration
    this.verifyTransporter();
  }

  /**
   * Verify transporter configuration
   */
  private async verifyTransporter() {
    try {
      await this.transporter.verify();
      this.logger.log('Mail transporter configured successfully');
    } catch (error) {
      this.logger.error('Mail transporter configuration failed:', error);
    }
  }

  /**
   * Send OTP verification email
   * @param email - Recipient email address
   * @param otp - 6-digit OTP code
   * @param userName - User's name for personalization
   */
  async sendOTPEmail(email: string, otp: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"${this.configService.get<string>('MAIL_FROM_NAME', 'TripMate App')}" <${this.configService.get<string>('MAIL_FROM_EMAIL')}>`,
      to: email,
      subject: 'Verify Your Email - TripMate App',
      html: this.getOTPEmailTemplate(otp, userName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent successfully to ${email}. Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }

  /**
   * Send welcome email after successful verification
   * @param email - Recipient email address
   * @param userName - User's name
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"${this.configService.get<string>('MAIL_FROM_NAME', 'TripMate App')}" <${this.configService.get<string>('MAIL_FROM_EMAIL')}>`,
      to: email,
      subject: 'Welcome to TripMate App!',
      html: this.getWelcomeEmailTemplate(userName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent successfully to ${email}. Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      // Don't throw error for welcome email - it's not critical
    }
  }

  /**
   * Send password reset email (for future use)
   * @param email - Recipient email address
   * @param resetToken - Password reset token
   * @param userName - User's name
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"${this.configService.get<string>('MAIL_FROM_NAME', 'TripMate App')}" <${this.configService.get<string>('MAIL_FROM_EMAIL')}>`,
      to: email,
      subject: 'Password Reset Request - TripMate App',
      html: this.getPasswordResetTemplate(userName, resetUrl),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}. Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error('Failed to send password reset email.');
    }
  }

  /**
   * OTP Email Template
   */
  private getOTPEmailTemplate(otp: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 0;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-box {
              background-color: #f8f8f8;
              border: 2px dashed #4F46E5;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
              font-size: 36px;
              letter-spacing: 10px;
              color: #4F46E5;
              font-weight: bold;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background-color: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 15px;
              margin: 20px 0;
              text-align: left;
              border-radius: 4px;
            }
            .footer {
              background-color: #f8f8f8;
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 14px;
            }
            .footer a {
              color: #4F46E5;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✈️ TripMate App</h1>
              <p style="margin: 5px 0; opacity: 0.9;">Email Verification</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-bottom: 10px;">Hello ${userName}!</h2>
              <p style="color: #666; font-size: 16px;">
                Thank you for registering with TripMate App. To complete your registration,
                please enter the verification code below:
              </p>
              <div class="otp-box">${otp}</div>
              <div class="warning">
                <strong>⏰ Important:</strong> This code will expire in 10 minutes.
              </div>
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                If you didn't create an account with TripMate App, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>© 2024 TripMate App. All rights reserved.</p>
              <p>
                This is an automated message, please do not reply to this email.
              </p>
              <p>
                Need help? <a href="#">Contact Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Welcome Email Template
   */
  private getWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 0;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .content {
              padding: 40px 30px;
            }
            .feature-list {
              background-color: #f8f8f8;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .feature-list ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .feature-list li {
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .feature-list li:last-child {
              border-bottom: none;
            }
            .feature-list li:before {
              content: "✓ ";
              color: #4F46E5;
              font-weight: bold;
              font-size: 18px;
            }
            .cta-button {
              display: inline-block;
              padding: 15px 40px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
              font-weight: bold;
            }
            .cta-button:hover {
              background-color: #4338CA;
            }
            .footer {
              background-color: #f8f8f8;
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to TripMate App!</h1>
              <p style="margin: 5px 0; opacity: 0.9;">Your adventure begins here</p>
            </div>
            <div class="content">
              <h2 style="color: #333;">Hi ${userName},</h2>
              <p style="color: #666; font-size: 16px;">
                Congratulations! Your email has been successfully verified and your account is now active.
              </p>
              <p style="color: #666; font-size: 16px;">
                Get ready to explore amazing destinations and create unforgettable memories!
              </p>
              <div class="feature-list">
                <h3 style="color: #333; margin-top: 0;">What you can do now:</h3>
                <ul>
                  <li>Browse and book incredible tours worldwide</li>
                  <li>Connect with experienced local guides</li>
                  <li>Share your travel stories and photos</li>
                  <li>Join a community of passionate travelers</li>
                  <li>Get exclusive deals and travel tips</li>
                </ul>
              </div>
              <center>
                <a href="${this.configService.get<string>('FRONTEND_URL', '#')}" class="cta-button">
                  Start Exploring
                </a>
              </center>
            </div>
            <div class="footer">
              <p>© 2024 TripMate App. All rights reserved.</p>
              <p>
                Follow us: 
                <a href="#">Facebook</a> | 
                <a href="#">Twitter</a> | 
                <a href="#">Instagram</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Password Reset Email Template
   */
  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            /* Similar styles as above */
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>We received a request to reset your password. Click the button below to proceed:</p>
              <center>
                <a href="${resetUrl}" class="cta-button">Reset Password</a>
              </center>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                If you didn't request this, please ignore this email. Your password won't be changed.
              </p>
              <p style="color: #999; font-size: 12px;">
                This link will expire in 1 hour for security reasons.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

interface User {
  username: string;
  email?: string;
}

/**
 * Service class for handling email operations
 */
class EmailService {
  private static readonly templatePath = path.join(
    __dirname,
    "..",
    "templates/email.html",
  );

  private static transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  /**
   * Read email template from file
   * @returns Promise resolving to template string
   */
  private static async getEmailTemplate(): Promise<string> {
    try {
      return await fs.readFile(this.templatePath, "utf8");
    } catch (error) {
      console.error("Error reading email template:", error);
      throw new Error(
        "Error reading email template. Please check file path or permissions.",
      );
    }
  }

  /**
   * Validate required environment variables
   * @throws Error if any required env var is missing
   */
  private static validateEnvVariables(): void {
    const requiredEnvVars = [
      "MAIL_USER",
      "MAIL_PASS",
      "APPNAME",
      "SUPPORTMAIL",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      console.warn(
        `Missing email environment variables: ${missingVars.join(", ")}. Email sending will be skipped.`,
      );
      return; // Don't throw error, just warn
    }
  }

  /**
   * Send forgot password email
   * @param user - User object
   * @param to - Recipient email address
   * @param code - Reset password code
   * @returns Promise that resolves when email is sent
   */
  public static async sendForgotPasswordMail(
    user: User,
    to: string,
    code: string,
  ): Promise<void> {
    const subject = "Forgot Password";
    const message = `Your reset password code is <b>${code}</b>`;
    await this.sendMail(user, to, subject, message);
  }

  /**
   * Replace template constants with actual values
   * @param template - Email template string
   * @param replacements - Object containing replacement key-value pairs
   * @returns Processed template string
   */
  private static replaceTemplateConstants(
    template: string,
    replacements: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(key, "g"), value);
    }
    return result;
  }

  /**
   * Send email with template
   * @param user - User object
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param message - Email message content
   * @returns Promise that resolves when email is sent
   */
  private static async sendMail(
    user: User,
    to: string,
    subject: string,
    message: string,
  ): Promise<void> {
    this.validateEnvVariables();

    // Check if required environment variables are missing
    if (
      !process.env.MAIL_USER ||
      !process.env.MAIL_PASS ||
      !process.env.APPNAME ||
      !process.env.SUPPORTMAIL
    ) {
      console.warn("Email configuration incomplete. Skipping email send.");
      console.log(`Password reset code for ${to}: ${message}`);
      return; // Exit gracefully without throwing error
    }

    try {
      const template = await this.getEmailTemplate();
      const replacements = {
        "#APPNAME#": process.env.APPNAME!,
        "#NAME#": user.username,
        "#MESSAGE#": message,
        "#SUPPORTMAIL#": process.env.SUPPORTMAIL!,
      };

      const html = this.replaceTemplateConstants(template, replacements);

      const mailOptions = {
        from: process.env.APPNAME!,
        to,
        subject,
        text: message,
        html,
      };

      const infoMail = await this.transport.sendMail(mailOptions);
      console.log(`Email sent successfully: ${infoMail.messageId}`);
    } catch (error) {
      console.error("Error sending email:", error);
      console.log(`Password reset code for ${to}: ${message}`);
      // Don't throw error, just log the code
    }
  }
}

export default EmailService;

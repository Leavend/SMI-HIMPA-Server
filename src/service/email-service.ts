import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

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

  private static validateEnvVariables(): void {
    const requiredEnvVars = [
      "MAIL_USER",
      "MAIL_PASS",
      "APPNAME",
      "SUPPORTMAIL",
    ];
    for (const varName of requiredEnvVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }
  }

  public static async sendForgotPasswordMail(
    user: any,
    to: string,
    code: string,
  ): Promise<void> {
    const subject = "Forgot Password";
    const message = `Your reset password code is <b>${code}</b>`;
    await this.sendMail(user, to, subject, message);
  }

  private static replaceTemplateConstants(
    template: string,
    replacements: Record<string, string>,
  ): string {
    for (const [key, value] of Object.entries(replacements)) {
      template = template.replace(new RegExp(key, "g"), value);
    }
    return template;
  }

  private static async sendMail(
    user: any,
    to: string,
    subject: string,
    message: string,
  ): Promise<void> {
    this.validateEnvVariables();

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
      throw new Error(
        "Failed to send email. Please check your email configuration.",
      );
    }
  }
}

export default EmailService;

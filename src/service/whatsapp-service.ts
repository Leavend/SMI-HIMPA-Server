import fs from "fs";
import path from "path";
import { htmlToText } from "html-to-text";
import moment from "moment";
import { getInstance } from "../utils/whatsapp-client";
import Utility from "../utils/index.utils";

const whatsappTemplateCommon = path.join(
  __dirname,
  "..",
  "templates/whatsapp-common.html",
);
const templateCommon = fs.readFileSync(whatsappTemplateCommon, "utf8");

const whatsappTemplateBorrow = path.join(
  __dirname,
  "..",
  "templates/whatsapp-borrow.html",
);
const templateBorrow = fs.readFileSync(whatsappTemplateBorrow, "utf8");

interface User {
  username?: string;
  email?: string;
}

/**
 * Service class for handling WhatsApp messaging operations
 */
class WhatsAppService {
  /**
   * Replace placeholders in template with actual values
   * @param template - HTML template string
   * @param placeholders - Object containing placeholder key-value pairs
   * @returns Processed template string
   */
  private static replacePlaceholders(
    template: string,
    placeholders: { [key: string]: string },
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(`#${key}#`, "g"), value);
    }
    return result;
  }

  /**
   * Format date to readable string
   * @param date - Date to format
   * @returns Formatted date string
   */
  private static formatDate(date: string | Date): string {
    return moment(date).format("DD MMMM YYYY");
  }

  /**
   * Get common placeholders for all messages
   * @param user - User object
   * @param to - Recipient phone number
   * @returns Object with common placeholders
   */
  private static getCommonPlaceholders(user: User, to: string) {
    return {
      APP_NAME: process.env.APPNAME || "YourApp",
      SUPPORT_CONTACT: process.env.SUPPORTMAIL || "support@example.com",
      NAME: user.username || "User",
      PHONE: to.replace(/@s\.whatsapp\.net$/, ""),
    };
  }

  /**
   * Send message internally using WhatsApp client
   * @param to - Recipient phone number
   * @param textMessage - Message text to send
   * @returns Promise that resolves when message is sent
   */
  private static async sendMessageInternal(
    to: string,
    textMessage: string,
  ): Promise<void> {
    try {
      const client = await getInstance();
      const chatId = Utility.formatPhoneNumberToWhatsApp(to);

      await client.sendMessage(chatId, { text: textMessage });
      console.log(`Message sent to ${to}`);
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  /**
   * Send borrow confirmation message to user
   * @param user - User object
   * @param to - Recipient phone number
   * @param itemName - Name of borrowed item
   * @param dateBorrow - Borrow date
   * @param dueDate - Due date
   * @returns Promise that resolves when message is sent
   */
  static async sendBorrowMessageToUser(
    user: User,
    to: string,
    itemName: string,
    dateBorrow: string,
    dueDate: string,
  ): Promise<void> {
    const placeholders = {
      ...this.getCommonPlaceholders(user, to),
      SUBJECT: "Borrow Confirmation",
      MESSAGE:
        "You have successfully borrowed an item from our warehouse. Please wait for admin confirmation.",
      ITEM: itemName || "item",
      DATE: this.formatDate(dateBorrow),
      DUE: this.formatDate(dueDate),
    };

    const htmlMessage = this.replacePlaceholders(templateBorrow, placeholders);
    const textMessage = htmlToText(htmlMessage, { wordwrap: 150 });

    await this.sendMessageInternal(to, textMessage);
  }

  /**
   * Send borrow status confirmation message to user
   * @param user - User object
   * @param to - Recipient phone number
   * @param itemName - Name of borrowed item
   * @param dateBorrow - Borrow date
   * @param dueDate - Due date
   * @param status - Borrow status (ACTIVE/REJECTED)
   * @returns Promise that resolves when message is sent
   */
  static async sendConfirmationBorrowMessageToUser(
    user: User,
    to: string,
    itemName: string,
    dateBorrow: string,
    dueDate: string,
    status: string,
  ): Promise<void> {
    const placeholders = {
      ...this.getCommonPlaceholders(user, to),
      ITEM: itemName || "item",
      DATE: this.formatDate(dateBorrow),
      DUE: this.formatDate(dueDate),
      STATUS: status.toUpperCase(),
    };

    let message = "";

    if (status === "ACTIVE") {
      message = `Your borrowing request for the item *${itemName}* has been *approved* by the admin. Please return it by the due date: ${placeholders.DUE}.`;
    } else if (status === "REJECTED") {
      message = `We regret to inform you that your borrowing request for the item *${itemName}* has been *rejected* by the admin.`;
    }

    const htmlMessage = this.replacePlaceholders(message, placeholders);
    const textMessage = htmlToText(htmlMessage, { wordwrap: 150 });

    await this.sendMessageInternal(to, textMessage);
  }

  /**
   * Send borrow notification message to admin
   * @param user - User requesting borrow
   * @param admin - Admin user object
   * @param to - Admin phone number
   * @param itemName - Name of borrowed item
   * @param dateBorrow - Borrow date
   * @param dueDate - Due date
   * @returns Promise that resolves when message is sent
   */
  static async sendBorrowMessageToAdmin(
    user: User,
    admin: User,
    to: string,
    itemName: string,
    dateBorrow: string,
    dueDate: string,
  ): Promise<void> {
    const placeholders = {
      ...this.getCommonPlaceholders(admin, to),
      SUBJECT: "Borrow Confirmation",
      MESSAGE: `You have an incoming borrow request from *${user.username}*. Please confirm the request.`,
      ITEM: itemName || "item",
      DATE: this.formatDate(dateBorrow),
      DUE: this.formatDate(dueDate),
    };

    const htmlMessage = this.replacePlaceholders(templateBorrow, placeholders);
    const textMessage = htmlToText(htmlMessage, { wordwrap: 150 });

    await this.sendMessageInternal(to, textMessage);
  }

  /**
   * Send generic message to user
   * @param user - User object
   * @param to - Recipient phone number
   * @param subject - Message subject
   * @param message - Message content
   * @returns Promise that resolves when message is sent
   */
  static async sendMessage(
    user: User,
    to: string,
    subject: string,
    message: string,
  ): Promise<void> {
    const placeholders = {
      ...this.getCommonPlaceholders(user, to),
      SUBJECT: subject,
      MESSAGE: message,
      EMAIL: user.email || "no-reply@example.com",
      DATE: new Date().toLocaleDateString(),
    };

    const htmlMessage = this.replacePlaceholders(templateCommon, placeholders);
    const textMessage = htmlToText(htmlMessage, { wordwrap: 150 });

    await this.sendMessageInternal(to, textMessage);
  }
}

export default WhatsAppService;

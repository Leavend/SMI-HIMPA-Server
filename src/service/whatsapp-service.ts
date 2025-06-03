import fs from "fs";
import path from "path";
import { htmlToText } from "html-to-text";
import moment from "moment";
import { getInstance } from "../utils/whatsapp-client";
import Utility from "../utils/index.utils";

const whatsappTemplateCommon = path.join(
  __dirname,
  "..",
  "templates/whatsapp-common.html"
);
const templateCommon = fs.readFileSync(whatsappTemplateCommon, "utf8");

const whatsappTemplateBorrow = path.join(
  __dirname,
  "..",
  "templates/whatsapp-borrow.html"
);
const templateBorrow = fs.readFileSync(whatsappTemplateBorrow, "utf8");

interface User {
  username?: string;
  email?: string;
}

class WhatsAppService {
  private static replacePlaceholders(
    template: string,
    placeholders: { [key: string]: string }
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(`#${key}#`, "g"), value);
    }
    return result;
  }

  private static formatDate(date: string | Date): string {
    return moment(date).format("DD MMMM YYYY");
  }

  private static getCommonPlaceholders(user: User, to: string) {
    return {
      APP_NAME: process.env.APPNAME || "YourApp",
      SUPPORT_CONTACT: process.env.SUPPORTMAIL || "support@example.com",
      NAME: user.username || "User",
      PHONE: to.replace(/@s\.whatsapp\.net$/, ""),
    };
  }

  private static async sendMessageInternal(to: string, textMessage: string): Promise<void> {
    const client = await getInstance();
    const chatId = Utility.formatPhoneNumberToWhatsApp(to); // Should return something like 628xxx@s.whatsapp.net

    await client.sendMessage(chatId, { text: textMessage });
    console.log(`Message sent to ${to}`);
  }

  static async sendBorrowMessageToUser(
    user: User,
    to: string,
    itemName: string,
    dateBorrow: string,
    dueDate: string
  ) {
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

  static async sendConfirmationBorrowMessageToUser(
    user: any,
    to: string,
    itemName: string,
    dateBorrow: string,
    dueDate: string,
    status: string
  ) {
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

  static async sendBorrowMessageToAdmin(
    user: User,
    admin: User,
    to: string,
    itemName: string,
    dateBorrow: string,
    dueDate: string
  ) {
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

  static async sendMessage(
    user: User,
    to: string,
    subject: string,
    message: string
  ) {
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

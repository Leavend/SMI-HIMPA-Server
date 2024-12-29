import fs from "fs";
import path from "path";
import { whatsappClient } from "../../index";
import Utility from "../utils/index.utils";
import { htmlToText } from "html-to-text";
import moment from "moment"; // Pastikan Anda memiliki moment.js sebagai dependency

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

class WhatsAppService {
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

  private static async sendMessageInternal(
    to: string,
    textMessage: string,
  ): Promise<void> {
    try {
      const chatId = Utility.formatPhoneNumberToWhatsApp(to);
      await whatsappClient.sendMessage(chatId, textMessage);
      console.log(`Message sent to ${to}`);
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  private static formatDate(date: string | Date): string {
    // Mengubah format tanggal menjadi DD MMMM YYYY
    return moment(date).format("DD MMMM YYYY");
  }

  static async sendBorrowMessageToUser(
    user: any,
    to: string,
    itemName: string,
    dateBorrow: string,
    dueDate: string,
  ) {
    const placeholders = {
      APP_NAME: process.env.APPNAME || "YourApp",
      SUPPORT_CONTACT: process.env.SUPPORTMAIL || "support@example.com",
      NAME: user || "user",
      SUBJECT: "Borrow Confirmation",
      MESSAGE:
        "You have successfully borrowed an item from our warehouse. Please wait for admin confirmation.",
      ITEM: itemName || "item",
      PHONE: to.replace(/@c\.us$/, ""),
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
    status: string,
  ) {
    const placeholders = {
      APP_NAME: process.env.APPNAME || "YourApp",
      SUPPORT_CONTACT: process.env.SUPPORTMAIL || "support@example.com",
      NAME: user || "user",
      ITEM: itemName || "item",
      PHONE: to.replace(/@c\.us$/, ""),
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
    user: any,
    admin: any,
    to: string,
    itemName: string,
    dateBorrow: string,
    dueDate: string,
  ) {
    const placeholders = {
      APP_NAME: process.env.APPNAME || "YourApp",
      SUPPORT_CONTACT: process.env.SUPPORTMAIL || "support@example.com",
      NAME: admin || "user",
      SUBJECT: "Borrow Confirmation",
      MESSAGE: `You have an incoming borrow request from *${user}*. Please confirm the request.`,
      ITEM: itemName || "item",
      PHONE: to.replace(/@c\.us$/, ""),
      DATE: this.formatDate(dateBorrow),
      DUE: this.formatDate(dueDate),
    };

    const htmlMessage = this.replacePlaceholders(templateBorrow, placeholders);
    const textMessage = htmlToText(htmlMessage, { wordwrap: 150 });

    await this.sendMessageInternal(to, textMessage);
  }

  static async sendMessage(
    user: any,
    to: string,
    subject: string,
    message: string,
  ) {
    const placeholders = {
      APP_NAME: process.env.APPNAME || "YourApp",
      SUPPORT_CONTACT: process.env.SUPPORTMAIL || "support@example.com",
      NAME: user.username || "User",
      SUBJECT: subject,
      MESSAGE: message,
      EMAIL: user.email || "no-reply@example.com",
      PHONE: to.replace(/@c\.us$/, ""),
      DATE: new Date().toLocaleDateString(),
    };

    const htmlMessage = this.replacePlaceholders(templateCommon, placeholders);
    const textMessage = htmlToText(htmlMessage, { wordwrap: 150 });

    await this.sendMessageInternal(to, textMessage);
  }
}

export default WhatsAppService;

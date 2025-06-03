import { WASocket } from "@whiskeysockets/baileys";
import application from "../../index";

let instance: WASocket | null = null;

export async function getInstance(): Promise<WASocket> {
  if (!instance) {
    instance = application.getWhatsAppClient();
    if (!instance) {
      throw new Error("WhatsApp client is not initialized yet.");
    }
  }
  return instance;
}

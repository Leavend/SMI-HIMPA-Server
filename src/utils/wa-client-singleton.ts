import { WASocket } from "@whiskeysockets/baileys";
let instance: WASocket | null = null;
export function setWhatsAppInstance(sock: WASocket) {
  instance = sock;
}
export function getWhatsAppInstance(): WASocket {
  if (!instance) throw new Error("WhatsApp client is not initialized yet.");
  return instance;
}
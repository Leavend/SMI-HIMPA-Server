import { getWhatsAppInstance } from "./wa-client-singleton";
export async function getInstance() {
  return getWhatsAppInstance();
}

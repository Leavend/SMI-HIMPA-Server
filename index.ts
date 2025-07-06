import app from './src/app';
import { APP_CONFIG } from './src/config/app-config';
import logger from './src/utils/logger';
import DbInitialize from './src/database/init';
import { setWhatsAppInstance } from "./src/utils/wa-client-singleton";
import { container } from 'tsyringe';
import {
  WASocket,
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import baileysLogger from './src/utils/baileysLogger';
import { Boom } from '@hapi/boom';

let whatsappClient: WASocket | null = null;

async function initializeWhatsAppClient() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: baileysLogger,
    });
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) qrcode.generate(qr, { small: true });
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.warn(`Connection closed. Reconnecting: ${shouldReconnect}`);
        if (shouldReconnect) initializeWhatsAppClient();
      }
      if (connection === 'open') logger.info('WhatsApp client is ready and connected.');
    });
    sock.ev.on('creds.update', saveCreds);
    whatsappClient = sock;
    setWhatsAppInstance(sock);
  } catch (error) {
    logger.error('Failed to initialize WhatsApp client:', error);
  }
}

async function start() {
  try {
    await DbInitialize();
    await initializeWhatsAppClient();
    app.listen(APP_CONFIG.port, () => {
      logger.info(`Server running on port ${APP_CONFIG.port}`);
      logger.info(`Environment: ${APP_CONFIG.env}`);
      logger.info('Database connection established successfully.');
    });
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

start();

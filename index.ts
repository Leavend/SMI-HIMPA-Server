import path from 'path';
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
  ConnectionState,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import baileysLogger from './src/utils/baileysLogger';
import { Boom } from '@hapi/boom';

let whatsappClient: WASocket | null = null;
let isInitializing = false;
let isReconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 10000; // 10 seconds

async function initializeWhatsAppClient(): Promise<void> {
  if (isInitializing) {
    logger.warn('WhatsApp client initialization already in progress, skipping...');
    return;
  }

  if (isReconnecting && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please restart the application manually.');
    return;
  }

  try {
    isInitializing = true;
    logger.info('Initializing WhatsApp client...');

    // Clear existing client if any
    if (whatsappClient) {
      try {
        await whatsappClient.logout();
      } catch (error) {
        logger.warn('Error during logout:', error);
      }
      whatsappClient = null;
    }

    const permanentSessionPath = path.resolve('baileys_auth');
    logger.info(`Using permanent session path: ${permanentSessionPath}`);
    const { state, saveCreds } = await useMultiFileAuthState(permanentSessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: baileysLogger,
      // Simplified configuration
      connectTimeoutMs: 30000,
      defaultQueryTimeoutMs: 30000,
      browser: ['HIMPA Server', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false,
      fireInitQueries: false, // Disable initial queries
      shouldIgnoreJid: jid => jid.includes('@broadcast'),
      // Remove problematic options
      // keepAliveIntervalMs: 25000,
      // emitOwnEvents: false,
      // generateHighQualityLinkPreview: false,
    });

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;
      
      logger.info(`Connection update: ${connection}`);
      
      if (qr) {
        logger.info('QR Code received. Please scan with WhatsApp:');
        qrcode.generate(qr, { small: true });
      }

      if (receivedPendingNotifications) {
        logger.info('Received pending notifications');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        logger.warn(`Connection closed with status: ${statusCode}`);

        // Handle different disconnect reasons
        switch (statusCode) {
          case DisconnectReason.connectionClosed:
            logger.info('Connection closed by server, will attempt to reconnect...');
            await handleReconnection();
            break;
          
          case DisconnectReason.connectionReplaced:
            logger.error('Connection replaced by another client. Please close other WhatsApp sessions.');
            isInitializing = false;
            isReconnecting = false;
            reconnectAttempts = 0;
            break;
          
          case DisconnectReason.loggedOut:
            logger.error('WhatsApp session logged out. Please re-authenticate.');
            // Clear auth data
            try {
              const fs = require('fs');
              const path = require('path');
              const authDir = path.join(__dirname, 'baileys_auth');
              if (fs.existsSync(authDir)) {
                fs.rmSync(authDir, { recursive: true, force: true });
                logger.info('Cleared authentication data');
              }
            } catch (error) {
              logger.error('Error clearing auth data:', error);
            }
            isInitializing = false;
            isReconnecting = false;
            reconnectAttempts = 0;
            break;
          
          case DisconnectReason.restartRequired:
            logger.info('Restart required, attempting to reconnect...');
            // Don't clear auth data immediately for restart required
            // Only clear if multiple attempts fail
            if (reconnectAttempts >= 2) {
              logger.info('Multiple restart attempts failed, clearing auth data...');
              try {
                const fs = require('fs');
                const path = require('path');
                const authDir = path.join(__dirname, 'baileys_auth');
                if (fs.existsSync(authDir)) {
                  fs.rmSync(authDir, { recursive: true, force: true });
                  logger.info('Cleared authentication data after multiple failures');
                }
              } catch (error) {
                logger.error('Error clearing auth data:', error);
              }
            }
            await handleReconnection();
            break;
          
          case DisconnectReason.timedOut:
            logger.warn('Connection timed out, reconnecting...');
            await handleReconnection();
            break;
          
          default:
            logger.warn(`Unknown disconnect reason: ${statusCode}, attempting to reconnect...`);
            await handleReconnection();
            break;
        }
      }

      if (connection === 'open') {
        logger.info('WhatsApp client is ready and connected!');
        isInitializing = false;
        isReconnecting = false;
        reconnectAttempts = 0;
        
        // Set the instance
        whatsappClient = sock;
        setWhatsAppInstance(sock);
        
        // Log connection info
        const user = sock.user;
        if (user) {
          logger.info(`Connected as: ${user.id} (${user.name || 'Unknown'})`);
          logger.info(`Verified: ${user.verifiedName ? 'Yes' : 'No'}`);
        }
        
        // Test connection by getting user info
        try {
          if (user) {
            const status = await sock.fetchStatus(user.id);
            if (status && status.length > 0) {
              logger.info(`User status: ${status[0].status || 'No status'}`);
            }
          }
        } catch (error) {
          logger.warn('Could not fetch user status:', error);
        }
      }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle messages
    sock.ev.on('messages.upsert', (m) => {
      logger.info('Received message:', m);
    });

    // Handle presence updates
    sock.ev.on('presence.update', (presence) => {
      logger.debug('Presence update:', presence);
    });

    // Handle groups
    sock.ev.on('groups.update', (updates) => {
      logger.debug('Groups update:', updates);
    });

  } catch (error) {
    logger.error('Failed to initialize WhatsApp client:', error);
    isInitializing = false;
    await handleReconnection();
  }
}

async function handleReconnection(): Promise<void> {
  if (isReconnecting) {
    logger.warn('Reconnection already in progress, skipping...');
    return;
  }

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached. Please restart the application.');
    isInitializing = false;
    isReconnecting = false;
    return;
  }

  isReconnecting = true;
  reconnectAttempts++;
  
  logger.info(`Attempting to reconnect... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
  
  setTimeout(async () => {
    isReconnecting = false;
    await initializeWhatsAppClient();
  }, RECONNECT_DELAY);
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

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  if (whatsappClient) {
    try {
      await whatsappClient.logout();
      logger.info('WhatsApp client logged out');
    } catch (error) {
      logger.error('Error during WhatsApp logout:', error);
    }
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down...');
  if (whatsappClient) {
    try {
      await whatsappClient.logout();
      logger.info('WhatsApp client logged out');
    } catch (error) {
      logger.error('Error during WhatsApp logout:', error);
    }
  }
  process.exit(0);
});

start();

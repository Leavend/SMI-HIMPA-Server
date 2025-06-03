import pino from "pino";

const baileysLogger = pino({ 
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            singleLine: true,
            levelFirst: true,
            messageFormat: "{msg}",
        },
    }
});

export default baileysLogger;

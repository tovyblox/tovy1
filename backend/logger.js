const winston = require('winston');

const dateFormat = () => { return new Date(Date.now()).toUTCString() }

const logger = new winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'info',
            handleExceptions: true,
            colorize: true,
        }),
        new winston.transports.Console({
            level: 'error',
            handleExceptions: true,
            colorize: true,

        }),
        new winston.transports.Console({
            level: 'log',
            handleExceptions: true,
            colorize: true,
        })
    ], format: winston.format.combine(
        winston.format.printf(info => {
            let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${info.message} | `;
            message = info.obj ? message + `data:${JSON.stringify(info.obj)} | ` : message;
            message = this.log_data ? message + `log_data:${JSON.stringify(this.log_data)} | ` : message;
            return message;
        }),
        winston.format.colorize({ all: false }),
    ),
    exitOnError: true,
});

module.exports = logger
'use strict'

var winston = require('winston'),
	aiLogger = require('./lib/winston-azure-application-insights').AzureApplicationInsightsLogger;

winston.add(aiLogger);
winston.remove(winston.transports.Console);

winston.info("Let's log something new...");
winston.error("This is an error log!");
winston.warn("And this is a warning message.");
winston.log("info", "Log with some metadata", {
	question: "Answer to the Ultimate Question of Life, the Universe, and Everything",
	answer: 42
});

process.exit();

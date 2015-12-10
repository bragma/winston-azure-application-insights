'use strict'

var winston = require('winston'),
	aiLogger = require('./lib/winston-azure-application-insights').AzureApplicationInsightsLogger;

winston.add(aiLogger);

winston.info("Let's log something new...");
winston.error("This is an error log!");
winston.warn("And this is a warning message.");
winston.log("info", "Log with some metadata", {
	question: "Answer to the Ultimate Question of Life, the Universe, and Everything",
	answer: 42
});

function ExtendedError(message, arg1, arg2) {
	this.message = message;
	this.name = "ExtendedError";
	this.arg1 = arg1;
	this.arg2 = arg2;
	Error.captureStackTrace(this, ExtendedError);
}
ExtendedError.prototype = Object.create(Error.prototype);
ExtendedError.prototype.constructor = ExtendedError;

winston.error("Log extended errors with properites", new ExtendedError("some error", "answer", 42));

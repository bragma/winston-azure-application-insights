'use strict';

var util = require('util'),
	appInsights = require("applicationinsights"),
	winston = require('winston');

// constants
var WINSTON_LOGGER_NAME = 'applicationinsightslogger';
var WINSTON_DEFAULT_LEVEL = 'info';
var DEFAULT_IS_SILENT = false;


// Remaping winston level on Application Insights 
function getMessageLevel(winstonLevel) {
	
	// TODO: Find a way to get the actual level values from AI's SDK
	// They are defined in SDK's "Library/Contracts.ts"
	 
	var levels = {
		emerg: 4,	// AI 'Critical' 
		alert: 4,	// AI 'Critical' 
		crit: 4,	// AI 'Critical' 
		error: 3,	// AI 'Error' 
		warning: 2,	// AI 'Warning' 
		warn:  2,	// AI 'Warning'
		notice: 1,	// AI 'Informational'
		info: 1,	// AI 'Informational'
		verbose: 0,	// AI 'Verbose'
		debug: 0,	// AI 'Verbose'
		silly: 0	// AI 'Verbose'
	};
	 
	return winstonLevel in levels ? levels[winstonLevel] : levels.info; 
} 


var AzureApplicationInsightsLogger = function (options) {
	
	options = options || {};
	
	winston.Transport.call(this, options);
	
	if (options.client) {
		
		// If client is set, just use it.
		// We expect it to be already configured and started
		this.client = options.client
		
	} else if (options.insights) {
		
		// If insights is set, just use the default client
		// We expect it to be already configured and started
		this.client = options.insights.client;
		
	} else {
		// Setup insights and start it
		// If options.key is defined, use it. Else the SDK will expect
		// an environment variable to be set.
		
		appInsights
			.setup(options.key)
			.start();
		
		this.client = appInsights.client; 
	}

	if (!this.client) {
		throw new Error('Could not get an Application Insights client instance');
	}
	
	this.name = WINSTON_LOGGER_NAME;
	this.level = options.level || WINSTON_DEFAULT_LEVEL;
	this.silent = options.silent || DEFAULT_IS_SILENT;
	this.treatErrorsAsExceptions = !!options.treatErrorsAsExceptions;
	
	// Setup AI here!
};

// 
// Inherits from 'winston.Transport'. 
// 
util.inherits(AzureApplicationInsightsLogger, winston.Transport); 

// 
// Define a getter so that 'winston.transport.AzureApplicationInsightsLogger' 
// is available and thus backwards compatible 
// 
winston.transports.AzureApplicationInsightsLogger = AzureApplicationInsightsLogger; 

// 
// ### function log (level, msg, [meta], callback) 
// #### @level {string} Level at which to log the message. 
// #### @msg {string} Message to log 
// #### @meta {Object} **Optional** Additional metadata to attach 
// #### @callback {function} Continuation to respond to when complete. 
// Core logging method exposed to Winston. Metadata is optional. 
// 

AzureApplicationInsightsLogger.prototype.log = function (level, msg, meta, callback) {
	
	if (typeof meta === 'function') { 
		callback = meta; 
		meta = {}; 
	}
	
 	callback = callback || function(){};
	  
	if (this.silent) { 
		return callback(null, true); 
	} 

	var aiLevel = getMessageLevel(level);
	
	if (this.treatErrorsAsExceptions) {
		if (aiLevel >= getMessageLevel('error')) {
			var error;
			if (msg instanceof Error) {
				error = msg;
			} else if (meta instanceof Error) {
				error = meta;
			} else {
				error = Error(msg);
			}
			this.client.trackException(error);
		}
	}

	if (meta instanceof Error) {
		var errorMeta = {
			stack: meta.stack,
			name: meta.name
		};
		
		for (var field in meta) {
			if(field === 'message' && !msg) {
				msg = meta[field];
				continue;
			} else if (field === 'constructor') {
				continue;
			}
			
			errorMeta[field] = meta[field];
		}
		
		meta = errorMeta;
	}

	this.client.trackTrace(msg, aiLevel, meta);
	
	return callback(null, true);
};

exports.AzureApplicationInsightsLogger = AzureApplicationInsightsLogger;

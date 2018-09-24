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
	var levels = {
		emerg: appInsights.Contracts.SeverityLevel.Critical,
		alert: appInsights.Contracts.SeverityLevel.Critical,
		crit: appInsights.Contracts.SeverityLevel.Critical,
		error: appInsights.Contracts.SeverityLevel.Error,
		warning: appInsights.Contracts.SeverityLevel.Warning,
		warn:  appInsights.Contracts.SeverityLevel.Warning,
		notice: appInsights.Contracts.SeverityLevel.Information,
		info: appInsights.Contracts.SeverityLevel.Information,
		verbose: appInsights.Contracts.SeverityLevel.Verbose,
		debug: appInsights.Contracts.SeverityLevel.Verbose,
		silly: appInsights.Contracts.SeverityLevel.Verbose,
	};

	return winstonLevel in levels ? levels[winstonLevel] : levels.info;
}

exports.getMessageLevel = getMessageLevel;

/**
 * Default formatter
 * @param {string} trackMethodName - trackTrace or trackException
 * @param {string} userLevel - the level that the log method was called with (note this is NOT the AI level!)
 * @param {{}} options - options that trackMethodName is called with (message, properties, meta, etc)
 * @returns {{}} - updated options
 */
function defaultFormatter(trackMethodName, userLevel, options) {
	return options;
}

exports.defaultFormatter = defaultFormatter;

/**
 * Application Insights mangles complex customDimensions properties to:
 * { nestedFields: [ [object Object], [object Object] ] }
 * This stringifies objects (maps, errors, etc) to work around this problem
 * @param meta
 * @returns {*}
 */
function fixNestedObjects(meta) {
	if (typeof meta === 'object') {
		Object.keys(meta).forEach(function (field) {
			const property = meta[field];
			if (typeof property === 'object') {
				meta[field] = util.inspect(property, { depth: null });
			}
		});
	}
	return meta;
}

var AzureApplicationInsightsLogger = function (options) {

	options = options || {};

	winston.Transport.call(this, options);

	if (options.client) {

		// If client is set, just use it.
		// We expect it to be already configured and started
		this.client = options.client;

	} else if (options.insights) {

		// If insights is set, just use the default client
		// We expect it to be already configured and started
		this.client = options.insights.defaultClient;

	} else {
		// Setup insights and start it
		// If options.key is defined, use it. Else the SDK will expect
		// an environment variable to be set.

		appInsights
			.setup(options.key)
			.start();

		this.client = appInsights.defaultClient;
	}

	if (!this.client) {
		throw new Error('Could not get an Application Insights client instance');
	}

	this.name = WINSTON_LOGGER_NAME;
	this.level = options.level || WINSTON_DEFAULT_LEVEL;
	this.silent = options.silent || DEFAULT_IS_SILENT;
	this.treatErrorsAsExceptions = !!options.treatErrorsAsExceptions;

	if (typeof options.formatter === 'function') {
		this.formatter = options.formatter;
	} else {
		this.formatter = defaultFormatter;
	}

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

	callback = callback || function () {
	};

	if (this.silent) {
		return callback(null, true);
	}

	var aiLevel = getMessageLevel(level);

	if (this.treatErrorsAsExceptions && aiLevel >= getMessageLevel('error')) {
		var error;
		var properties = {};
		if (msg instanceof Error) {
			error = msg;
		} else if (meta instanceof Error) {
			error = meta;
			meta = {};
			Object.assign(properties, meta);
		} else {
			error = Error(msg);
		}
		if (typeof msg === 'string') {
			properties.message = msg;
		}
		this.client.trackException(
			this.formatter('trackException', level, {
				exception: error,
				properties: properties,
			})
		);
	}
	else {
		if (meta instanceof Error) {
			var errorMeta = {
				stack: meta.stack,
				name: meta.name
			};

			for (var field in meta) {
				if (field === 'message' && !msg) {
					msg = meta[field];
					continue;
				} else if (field === 'constructor') {
					continue;
				}

				errorMeta[field] = meta[field];
			}

			meta = errorMeta;
		}

		this.client.trackTrace(
			this.formatter('trackTrace', level, {
				message: msg,
				severity: aiLevel,
				properties: fixNestedObjects(meta),
			})
		);
	}

	return callback(null, true);
};

exports.AzureApplicationInsightsLogger = AzureApplicationInsightsLogger;

'use strict';


var assert = require('chai').assert,
	sinon = require('sinon');
	
var winston = require('winston'),
	appInsights = require("applicationinsights"),
	transport = require('../lib/winston-azure-application-insights');

afterEach(function() {
	appInsights
		.setAutoCollectExceptions(false)
		.dispose();
})

describe ('winston-azure-application-insights', function() {
	describe('class', function() {
		describe('constructor', function() {
	
			beforeEach(function() {
				delete process.env['APPINSIGHTS_INSTRUMENTATIONKEY'];
			});
	
			it('should fail if no instrumentation insights instance, client or key specified', function() {
				assert.throws(function() {
					new transport.AzureApplicationInsightsLogger();
				}, /key not found/);
			});
			
			it('should accept an App Insights instance with the insights option', function() {
				
				var aiLogger;
				
				assert.doesNotThrow(function() {
					appInsights.setup('FAKEKEY');
				
					aiLogger = new transport.AzureApplicationInsightsLogger({
						insights: appInsights
					});
				});
				
				assert.ok(aiLogger.client);
			});
			
			it('should accept an App Insights client with the client option', function() {
				
				var aiLogger;
				
				assert.doesNotThrow(function() {
					aiLogger = new transport.AzureApplicationInsightsLogger({
						client: appInsights.getClient('FAKEKEY')
					});
				});
				
				assert.ok(aiLogger.client);
			});
	
			it('should accept an instrumentation key with the key option', function() {
				
				var aiLogger;
	
				assert.doesNotThrow(function() {
					aiLogger = new transport.AzureApplicationInsightsLogger({
						key: 'FAKEKEY'
					});
				});
	
				assert.ok(aiLogger.client);
			});
	
			it('should use the APPINSIGHTS_INSTRUMENTATIONKEY environment variable if defined', function() {
				
				var aiLogger;
	
				process.env['APPINSIGHTS_INSTRUMENTATIONKEY'] = 'FAKEKEY';
	
				assert.doesNotThrow(function() {
					aiLogger = new transport.AzureApplicationInsightsLogger();
				});
	
				assert.ok(aiLogger.client);
			});
			
			it('should set default logging level to info', function() {
				var aiLogger = new transport.AzureApplicationInsightsLogger({
						key: 'FAKEKEY'
					});
					
				assert.equal(aiLogger.level, 'info'); 
			});
			
			it('should set logging level', function() {
				var aiLogger = new transport.AzureApplicationInsightsLogger({
						key: 'FAKEKEY',
						level: 'warn'
					});
					
				assert.equal(aiLogger.level, 'warn'); 
			});
			
			it('should set default silent to false', function() {
				var aiLogger = new transport.AzureApplicationInsightsLogger({
					key: 'FAKEKEY'
				});
					
				assert.notOk(aiLogger.silent); 
			});
	
			it('should set silent', function() {
				var aiLogger = new transport.AzureApplicationInsightsLogger({
					key: 'FAKEKEY',
					silent: true
				});
					
				assert.ok(aiLogger.silent); 
			});
			
			it('should declare a Winston logger', function() {
				new transport.AzureApplicationInsightsLogger({
					key: 'FAKEKEY'
				});
				
				assert.ok(winston.transports.AzureApplicationInsightsLogger);
			});
		});
		
		describe('#log', function() {
	
			var aiLogger,
				clientMock,
				expectTrace;
			
			beforeEach(function() {
				aiLogger = new transport.AzureApplicationInsightsLogger({ key: 'FAKEKEY' });
				clientMock = sinon.mock(appInsights.client);
				expectTrace = clientMock.expects("trackTrace");
			})
			
			afterEach(function() {
				clientMock.restore();
			});


			it('should not log if silent', function() {
				aiLogger.silent = true;
	
				expectTrace.never();
				
				aiLogger.log('info', 'some log text...');
			});
	
			it('should log with correct log levels', function() {
				clientMock.expects("trackTrace").once().withArgs('emerg', 4);
				clientMock.expects("trackTrace").once().withArgs('alert', 4);
				clientMock.expects("trackTrace").once().withArgs('crit', 4);
				clientMock.expects("trackTrace").once().withArgs('error', 3);
				clientMock.expects("trackTrace").once().withArgs('warning', 2);
				clientMock.expects("trackTrace").once().withArgs('warn', 2);
				clientMock.expects("trackTrace").once().withArgs('notice', 1);
				clientMock.expects("trackTrace").once().withArgs('info', 1);
				clientMock.expects("trackTrace").once().withArgs('verbose', 0);
				clientMock.expects("trackTrace").once().withArgs('debug', 0);
				clientMock.expects("trackTrace").once().withArgs('silly', 0);
				clientMock.expects("trackTrace").once().withArgs('undefined', 1);
				
				[ 'emerg', 'alert', 'crit', 'error', 'warning', 'warn', 'notice', 'info', 'verbose', 'debug', 'silly', 'undefined']
				.forEach(function(level) {
					aiLogger.log(level, level);
				});
			});
		});
		
		describe('#log errors as exceptions', function() {
	
			var aiLogger,
				clientMock;

			beforeEach(function() {
				aiLogger = new transport.AzureApplicationInsightsLogger(
					{ key: 'FAKEKEY', treatErrorsAsExceptions: true }
				);
				clientMock = sinon.mock(aiLogger.client);
			})
			
			afterEach(function() {
				clientMock.restore();
			});


			it('should not track exceptions with default option', function() {
				aiLogger = new transport.AzureApplicationInsightsLogger({ key: 'FAKEKEY' });
				
				clientMock.expects("trackException").never();
				
				aiLogger.log('error', 'error message');
			});
			
			it('should not track exceptions if the option is off', function() {
				aiLogger = new transport.AzureApplicationInsightsLogger({
					key: 'FAKEKEY', treatErrorsAsExceptions: false
				});
	
				clientMock.expects("trackException").never();
				
				aiLogger.log('error', 'error message');
			});

			it('should not track exceptions if level < error', function() {
				clientMock.expects("trackException").never();

				['warning', 'warn', 'notice', 'info', 'verbose', 'debug', 'silly', 'undefined']
				.forEach(function(level) {
					aiLogger.log(level, level);
				});
				clientMock.verify();
			});

			it('should track exceptions if level >= error and msg is a string', function() {
				var error = new Error('error msg');

				clientMock.expects("trackException").once().withArgs(error);
				clientMock.expects("trackException").once().withArgs(error);
				clientMock.expects("trackException").once().withArgs(error);
				clientMock.expects("trackException").once().withArgs(error);

				[ 'emerg', 'alert', 'crit', 'error']
				.forEach(function(level) {
					aiLogger.log(level, 'error msg');
				});
				clientMock.verify();
			});

			it('should track exceptions if level == error and msg is an Error obj', function() {
				var error = new Error('error msg');
				var expectedCall = clientMock.expects("trackException");

				expectedCall.once().withArgs(error);
				aiLogger.log('error', error);
				clientMock.verify();
				assert.equal(expectedCall.args[0][0].message, error.message);
			});

			it('should track exceptions if level == error and meta is an Error obj', function() {
				var error = new Error('error msg');
				var expectedCall = clientMock.expects("trackException");

				expectedCall.once().withArgs(error);
				aiLogger.log('error', 'some message', error);
				clientMock.verify();
				assert.equal(expectedCall.args[0][0].message, error.message);
			});
		});
	});

	describe('winston', function() {
		
		function ExtendedError(message, arg1, arg2) {
			this.message = message;
			this.name = "ExtendedError";
			this.arg1 = arg1;
			this.arg2 = arg2;
			Error.captureStackTrace(this, ExtendedError);
		}
		ExtendedError.prototype = Object.create(Error.prototype);
		ExtendedError.prototype.constructor = ExtendedError;

		var winstonLogger,
			clientMock,
			expectTrace;

		beforeEach(function() {
			
			winstonLogger = new(winston.Logger)({
				transports: [ new winston.transports.AzureApplicationInsightsLogger({ key: 'FAKEKEY' })	]
			});

			clientMock = sinon.mock(appInsights.client);
			expectTrace = clientMock.expects("trackTrace");
		})
		
		afterEach(function() {
			clientMock.restore();
		});
	
		it('should log from winston', function() {
			var logMessage = "some log text...",
				logLevel = 'error',
				logMeta = {
					text: 'some meta text',
					value: 42
				};

			expectTrace.once().withExactArgs(logMessage, 3, logMeta);

			winstonLogger.log(logLevel, logMessage, logMeta);
		});

		it('should log errors with all fields', function() {
			var error = new ExtendedError("errormessage", "arg1", "arg2");

			expectTrace.once().withExactArgs(error.message, 3, {
				arg1: error.arg1,
				arg2: error.arg2,
				name: error.name,
				stack: error.stack
			});

			winstonLogger.error(error);
		});

		it('should log errors with all fields and message', function() {
			var message = "message";
			var error = new ExtendedError("errormessage", "arg1", "arg2");

			expectTrace.once().withExactArgs(message, 3, {
				arg1: error.arg1,
				arg2: error.arg2,
				message: error.message,
				name: error.name,
				stack: error.stack
			});

			winstonLogger.error(message, error);
		});
	});
});
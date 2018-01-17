'use strict';


var assert = require('chai').assert,
	sinon = require('sinon');
	
var winston = require('winston'),
	appInsights = require("applicationinsights"),
	transport = require('../lib/winston-azure-application-insights');

afterEach('teardown appInsights', function() {
	appInsights.dispose();
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
						client: new appInsights.TelemetryClient('FAKEKEY')
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
				clientMock = sinon.mock(appInsights.defaultClient);
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
				clientMock.expects("trackTrace").once().withArgs({ message: 'emerg', severity: 4, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'alert', severity: 4, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'crit', severity: 4, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'error', severity: 3, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'warning', severity: 2, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'warn', severity: 2, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'notice', severity: 1, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'info', severity: 1, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'verbose', severity: 0, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'debug', severity: 0, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'silly', severity: 0, properties: undefined });
				clientMock.expects("trackTrace").once().withArgs({ message: 'undefined', severity: 1, properties: undefined });
				
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
				var freshClient = new appInsights.TelemetryClient('FAKEKEY');
				aiLogger = new transport.AzureApplicationInsightsLogger(
					{ client: freshClient, treatErrorsAsExceptions: true }
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
				[ 'emerg', 'alert', 'crit', 'error']
				.forEach(function(level) {
					var exceptionMock = clientMock.expects("trackException").once();
					clientMock.expects("trackTrace").never();
					aiLogger.log(level, 'log level custom error msg');
					assert.equal(exceptionMock.args[0][0].exception.message, 'log level custom error msg');
					assert.equal(exceptionMock.args[0][0].properties.message, 'log level custom error msg');
				});
				clientMock.verify();
			});

			it('should track exceptions if level == error and msg is an Error obj', function() {
				var error = new Error('error msg');
				var expectedCall = clientMock.expects("trackException");

				expectedCall.once().withArgs({
					exception: error,
					properties: {},
				});
				aiLogger.log('error', error);
				clientMock.verify();
				assert.equal(expectedCall.args[0][0].exception.message, error.message);
			});

			it('should track exceptions if level == error and meta is an Error obj', function() {
				var error = new Error('error msg');
				var expectedCall = clientMock.expects("trackException");

				expectedCall.once().withArgs({
					exception: error,
					properties: {
						message: 'some message',
					},
				});
				aiLogger.log('error', 'some message', error);
				clientMock.verify();
				assert.equal(expectedCall.args[0][0].exception.message, error.message);
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

			var freshClient = new appInsights.TelemetryClient('FAKEKEY');
			
			winstonLogger = new(winston.Logger)({
				transports: [ new winston.transports.AzureApplicationInsightsLogger({ client: freshClient })	]
			});

			clientMock = sinon.mock(freshClient);
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

			expectTrace.atMost(1);

			winstonLogger.log(logLevel, logMessage, logMeta);

			var traceArg = expectTrace.args[0][0];

			assert.equal(traceArg.message, logMessage);
			assert.equal(traceArg.severity, 3);
			assert.equal(traceArg.properties, logMeta);
		});

		it('should log errors with all fields', function() {
			var error = new ExtendedError("errormessage", "arg1", "arg2");

			expectTrace.once().withArgs({
				message: error.message,
				severity: 3,
				properties: {
					arg1: error.arg1,
					arg2: error.arg2,
					name: error.name,
					stack: error.stack,
				},
			});

			winstonLogger.error(error);
		});

		it('should log errors with all fields and message', function() {
			var message = "message";
			var error = new ExtendedError("errormessage", "arg1", "arg2");

			expectTrace.once().withArgs({
				message: message,
				severity: 3,
				properties: {
					arg1: error.arg1,
					arg2: error.arg2,
					message: error.message,
					name: error.name,
					stack: error.stack,
				},
			});

			winstonLogger.error(message, error);
		});
	});
});
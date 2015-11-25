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
	
			it('should default unknown log levels to info', function() {
				var logMessage = "some log text...",
					logLevel = 'undefined'
	
				expectTrace.once().withExactArgs(logMessage, 1, undefined);
				
				aiLogger.log(logLevel, logMessage);
			});
		});
	});

	describe('winston', function() {
		
		var winstonLogger,
			clientMock,
			expectTrace;
			
		beforeEach(function() {
			
			winstonLogger = new(winston.Logger)({
				transports: [
					new winston.transports.AzureApplicationInsightsLogger({
						key: 'FAKEKEY'
					})
				]
			});
			
			clientMock = sinon.mock(appInsights.client);
			expectTrace = clientMock.expects("trackTrace");
		})
		
		afterEach(function() {
			clientMock.restore();
		});
	
		
		it('should log from winston', function() {
			var logMessage = "some log text...",
				logLevel = 'info',
				logMeta = {
					text: 'some meta text',
					value: 42
				};

			expectTrace.once().withExactArgs(logMessage, 1, logMeta);

			winstonLogger.log(logLevel, logMessage, logMeta);
		});		
	});
});
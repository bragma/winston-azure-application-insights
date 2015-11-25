'use strict';


var assert = require('chai').assert;
	
var appInsights = require("applicationinsights"),
	transport = require('../lib/winston-azure-application-insights');

afterEach(function() {
	appInsights.dispose();
})

describe ('winston-azure-application-insights', function() {
	describe('constructor', function() {

		it('should fail if no instrumentation insights instance, client or key specified', function() {
			assert.throws(function() {
				new transport.AzureApplicationInsightsLogger();
			}, /key not found/);
		});
		
		it('should accept an App Insights instance with the insights option', function() {
			
			var aiLogger;
			
			assert.doesNotThrow(function() {
				appInsights.setup("FAKEKEY");
			
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
					client: appInsights.getClient("FAKEKEY")
				});
			});
			
			assert.ok(aiLogger.client);
		});

		it('should accept an instrumentation key with the key option', function() {
			
			var aiLogger;

			assert.doesNotThrow(function() {
				aiLogger = new transport.AzureApplicationInsightsLogger({
					key: "FAKEKEY"
				});
			});

			assert.ok(aiLogger.client);
		});
		
		it('should set default logging level to info', function() {
			var aiLogger = new transport.AzureApplicationInsightsLogger({
					key: "FAKEKEY"
				});
				
			assert.equal(aiLogger.level, 'info'); 
		});
		
		it('should set logging level', function() {
			var aiLogger = new transport.AzureApplicationInsightsLogger({
					key: "FAKEKEY",
					level: 'warn'
				});
				
			assert.equal(aiLogger.level, 'warn'); 
		});
		
		it('should set default silent to false', function() {
			var aiLogger = new transport.AzureApplicationInsightsLogger({
				key: "FAKEKEY"
			});
				
			assert.notOk(aiLogger.silent); 
		});

		it('should set silent', function() {
			var aiLogger = new transport.AzureApplicationInsightsLogger({
				key: "FAKEKEY",
				silent: true
			});
				
			assert.ok(aiLogger.silent); 
		});
	})
});
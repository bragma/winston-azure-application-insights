winston-azure-application-insights
==================================

An [Azure Application Insights][0] transport for [Winston][1] logging library. Allows to log on App Insights trace with Winston.

## Installation

Tested on node-5.10.x, requires npm.

```sh
  $ npm install winston
  $ npm install winston-azure-application-insights
```

## Usage

See `demo.js` for a small example.

**Instrumentation key**

**Note**: an instrumentation key is required before any data can be sent. Please see the
"[Getting an Application Insights Instrumentation Key](https://github.com/Microsoft/AppInsights-Home/wiki#getting-an-application-insights-instrumentation-key)"
for more information.

The instrumentation key can be supplied in 4 ways:

* Specifying the "key" property in the options of the transport:

```javascript
var aiLogger = require('winston-azure-application-insights').AzureApplicationInsightsLogger;

// Create an app insights client with the given key
winston.add(aiLogger, {
	key: "<YOUR_INSTRUMENTATION_KEY_HERE>"
});
```

* Passing an initialized Application Insights module reference in the "insights" options property (This may be useful
 if you want to configure AI to suit your needs):

```javascript
var appInsights = require("applicationinsights"),
	aiLogger = require('winston-azure-application-insights').AzureApplicationInsightsLogger;

appInsights.setup("<YOUR_INSTRUMENTATION_KEY_HERE>").start();

// Use an existing app insights SDK instance
winston.add(aiLogger, {
	insights: appInsights
});
```

* Passing an initialized Application Insights client in the "client" options property:

```javascript
var appInsights = require("applicationinsights"),
	aiLogger = require('winston-azure-application-insights').AzureApplicationInsightsLogger;

appInsights.setup("<YOUR_INSTRUMENTATION_KEY_HERE>").start();

// Create a new app insights client with another key
winston.add(aiLogger, {
	client: appInsights.getClient("<ANOTHER_INSTRUMENTATION_KEY_HERE>")
});
```

* Setting the `APPINSIGHTS_INSTRUMENTATIONKEY` environment variable (supported by the Application Insights SDK)

**I get an error when using this transport**

If you receive the error:

"Instrumentation key not found, pass the key in the config to this method or set the key in the environment variable APPINSIGHTS_INSTRUMENTATIONKEY before starting the server"

Then you didn't specify a suitable instrumentation key. See the section above.


## Options

* **level**: lowest logging level transport to be logged (default: `info`)
* **silent**: Boolean flag indicating whether to suppress output (default: `false`)
* **treatErrorsAsExceptions**: Boolean flag indicating whether to treat errors as exceptions. 
See section below for more details (default: `false`).

**SDK integration options (required):**

Ony one of the above option parameters will be used, in this order: client, insights, key.

* **client**: An existing App Insights client
* **insights**: An App Insights SDK instance (needs to be already started)
* **key**: App Insights instrumentation key. An instance of the SDK will be initialized and started using this key. In lieu of this setting, you can set the environment variable: `APPINSIGHTS_INSTRUMENTATIONKEY`

## Log Levels

Supported log levels are:

Winston Level | App Insights level
---------------|------------------
emerg          | critical (4)
alert          | critical (4)
crit           | critical (4)
error          | error (3)
warning        | warning (2)
warn           | warning (2)
notice         | informational (1)
info           | informational (1)
verbose        | verbose (0)
debug          | verbose (0)
silly          | verbose (0)

**All other possibile Winston's levels, or custom levels, will default to `info`**

[0]: https://azure.microsoft.com/en-us/services/application-insights/
[1]: https://github.com/flatiron/winston

## Treating errors as exceptions

You can set the option `treatErrorsAsExceptions` when configuring the transport to treat errors as app insights exceptions for log levels >= `error` (defaults to `false`).

This allows you to see it clearly in the Azure Application Insights instead of having to access trace information manually and set up alerts based on the related metrics.

How it works:

* `winstonLogger.log('error', 'error message');` will trigger an app insights `trackException` with `Error('error message')` as argument

* `winstonLogger.log('error', new Error('error message'));` will trigger an app insights `trackException` with the Error object as argument

* `winstonLogger.log('error', 'error message', new Error('error message'));` will trigger an app insights `trackException` with the Error object as argument

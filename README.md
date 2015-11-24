winston-azure-application-insights
==================================

An [Azure Application Insights][0] transport for [Winston][1] logging library.

** THIS IS AN ALPHA VERSION, USE AT YOU OWN RISK! **

## Installation

Tested on node-5.10.x, requires npm.

``` sh
  $ npm install winston
  $ TBD
```
## Usage

See demo.js for a small example.

```javascript
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

```

## Options

TBD

## Log Levels
Supported log levels are the following:

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
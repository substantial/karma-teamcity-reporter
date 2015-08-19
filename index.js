var util = require('util')
var fs = require('fs')

var escapeMessage = function (message) {
  if (message === null || message === undefined) {
    return ''
  }

  return message.toString()
    .replace(/\|/g, '||')
    .replace(/\'/g, "|'")
    .replace(/\n/g, '|n')
    .replace(/\r/g, '|r')
    .replace(/\u0085/g, '|x')
    .replace(/\u2028/g, '|l')
    .replace(/\u2029/g, '|p')
    .replace(/\[/g, '|[')
    .replace(/\]/g, '|]')
}

var formatMessage = function () {
  var args = Array.prototype.slice.call(arguments)

  for (var i = args.length - 1; i > 0; i--) {
    args[i] = escapeMessage(args[i])
  }
  return util.format.apply(null, args) + '\n'
}

var fullTestName = function (result) {
  return result.suite.join(' ') + ' ' + result.description
}

var TeamcityReporter = function (baseReporterDecorator) {
  baseReporterDecorator(this)
  var self = this

  this.adapters = [fs.writeSync.bind(fs.writeSync, 1)]

  this.TEST_IGNORED = "##teamcity[testIgnored name='%s']"
  this.SUITE_START = "##teamcity[testSuiteStarted name='%s']"
  this.SUITE_END = "##teamcity[testSuiteFinished name='%s']"
  this.TEST_START = "##teamcity[testStarted name='%s']"
  this.TEST_FAILED = "##teamcity[testFailed name='%s' message='FAILED' details='%s']"
  this.TEST_END = "##teamcity[testFinished name='%s' duration='%s']"
  this.BLOCK_OPENED = "##teamcity[blockOpened name='%s']"
  this.BLOCK_CLOSED = "##teamcity[blockClosed name='%s']"

  this.onRunStart = function (browsers) {
    this.write(formatMessage(this.BLOCK_OPENED, 'JavaScript Unit Tests'))

    this._browsers = []
  }

  this.specSuccess = function (browser, result) {
    var testName = fullTestName(result)

    this.write(formatMessage(this.TEST_START, testName))
    this.write(formatMessage(this.TEST_END, testName, result.time))
  }

  this.specFailure = function (browser, result) {
    var testName = fullTestName(result)

    this.write(formatMessage(this.TEST_START, testName))
    this.write(formatMessage(this.TEST_FAILED, testName, result.log.join('\n\n')))
    this.write(formatMessage(this.TEST_END, testName, result.time))
  }

  this.specSkipped = function (browser, result) {
    var testName = fullTestName(result)

    this.write(formatMessage(this.TEST_IGNORED, testName))
  }

  this.onRunComplete = function () {
    self.write(formatMessage(self.BLOCK_CLOSED, 'JavaScript Unit Tests'))
  }
}

TeamcityReporter.$inject = ['baseReporterDecorator']

module.exports = {
  'reporter:teamcity': ['type', TeamcityReporter]
}

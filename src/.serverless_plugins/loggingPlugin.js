const _ = require('lodash');
const path = require('path');

class MyPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'after:deploy:compileFunctions': this.logServerless.bind(this)
    }
  }

  logServerless() {
    this.serverless.service.getAllFunctions().forEach((functionName) => {
      if (functionName === 'loghandler') {
        return
      }
      const normalizedFunctionName = functionName[0].toUpperCase() + functionName.substr(1);
      const functionLogicalId = `${normalizedFunctionName}LambdaFunction`;

      const functionObject = this.serverless.service.getFunction(functionName);
      const cloudwatchLogsSubscriptionFilterTemplate = this.serverless.utils.readFileSync(
          path.join(
            this.serverless.config.servicePath, 
            '.serverless_plugins', 
            'cloudwatch-logs-subscription-filter-template.json'
            )
        )

      cloudwatchLogsSubscriptionFilterTemplate.Properties.LogGroupName = `/aws/lambda/${functionObject.name}`
      
      const logGroup = 
      `
      {
        "Type" : "AWS::Logs::LogGroup",
        "Properties" : {
          "LogGroupName" : "${cloudwatchLogsSubscriptionFilterTemplate.Properties.LogGroupName}"
        }
      }
      `
      
      
      const newResources = {
        [`${functionLogicalId}SubscriptionFilter`]: cloudwatchLogsSubscriptionFilterTemplate,
        [`${functionLogicalId}LogGroup`]: JSON.parse(logGroup),
      }

      _.merge(this.serverless.service.provider.compiledCloudFormationTemplate.Resources,
        newResources)
      
    })
  }
}

module.exports = MyPlugin;
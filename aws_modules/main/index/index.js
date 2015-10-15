'use strict';

var AWS      = require('aws-sdk'),
    moment   = require('moment'),
    Promise  = require('bluebird');

var dynamodb = new AWS.DynamoDB();
Promise.promisifyAll(Object.getPrototypeOf(dynamodb));

var lambda = new AWS.Lambda();
Promise.promisifyAll(Object.getPrototypeOf(lambda), {suffix: 'Promised'}); // invokeAsync already exists


module.exports.run = function(event, context, cb) {
  var emailRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

  if (!emailRegex.test(event.email)) {
    return cb(null, {error: 'Please provide a valid email address.', result: null});
  }

  var incrementVerificationsSent = function(email) {
    var params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        email: { S: email }
      },
      AttributeUpdates: {
        verificationsSent: {
          Action: 'ADD',
          Value: {
            N: '1'
          }
        }
      }
    };

    return dynamodb.updateItemAsync(params);
  };

  var sendVerificationEmail = function(data) {
    var event = {
      from: process.env.EMAIL_SERVICE_USER,
      to: data.Item.email.S,
      subject: 'Verify Email!',
      template: 'verification',
      context: {
        verification_code: data.Item.verificationCode.S
      }
    };
    var params = {
      FunctionName: 'awsm-mailer',
      InvocationType: 'Event',
      Payload: JSON.stringify(event)
    };

    lambda.invokePromised(params)

      // I need to pass the extra email argument, so I'm using a wrapper function expression #promises
      // http://stackoverflow.com/questions/21271400/bluebird-promisify-multiple-arguments
      .then(function(lambdaResult) {
        return incrementVerificationsSent(data.Item.email.S); })
      .then(function(data) {
        return cb(null, {error: null, result: 'verification email sent'});
      });
  };

  var sendDataEmail = function(email) {
    var event = {
      from: process.env.EMAIL_SERVICE_USER,
      to: email,
      subject: 'Data Received!',
      template: 'data',
      context: {
        data: JSON.stringify(event.data, null, 4)
      }
    };
    var params = {
      FunctionName: 'awsm-mailer',
      InvocationType: 'Event',
      Payload: JSON.stringify(event)
    };

    lambda.invoke(params)
      .then(function(data) {
        return cb(null, {error: null, result: 'data email sent'});
      });
  };

  var handleData = function(data) {
    if (data && 'Item' in data) {
      if (data.Item.isVerified.BOOL) {
        return sendDataEmail(data.Item.email.S);

      } else if (Number(data.Item.verificationsSent.N) < 10) {
        return sendVerificationEmail(data);

      } else { // return error
        return cb(null, {error: 'Maximum number of verifications exceeded.', result: null});
      }
    } else { // create Item
      dynamodb.putItemAsync({
        TableName: process.env.TABLE_NAME,
        Item: {
          email:             { S: event.email },
          isVerified:        { BOOL: false },
          verificationsSent: { N: '0' },
          verificationCode:  { S: Math.floor((Math.random() * 100) + 54).toString() },
          created:           { S: moment().unix().toString() },
          updated:           { S: moment().unix().toString() }
        },
        ConditionExpression: 'attribute_not_exists (email)'
      }).then(function(data) {
        return sendVerificationEmail(data);
      });
    }
  };

  var params = {
    TableName: process.env.TABLE_NAME,
    Key: {
      email: { S: event.email }
    }
  };

  dynamodb.getItemAsync(params)
    .then(handleData)
    .catch(function(e) {
      console.log('talk to me!');
      console.log(e);
      return cb(new Error('Something went wrong!'));
    });
};

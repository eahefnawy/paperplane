'use strict';

var AWS      = require('aws-sdk'),
    Promise  = require('bluebird');

var dynamodb = new AWS.DynamoDB();
Promise.promisifyAll(Object.getPrototypeOf(dynamodb));

module.exports.run = function(event, context, cb) {
  if (!event.code) {
    return cb(null, {error: 'Missing code parameter.', result: null});
  }

  var handleData = function(data) {
    if (data && 'Items' in data && !data.Items[0].isVerified.BOOL) {
      var params = {
        TableName: process.env.TABLE_NAME,
        Key: {
          email: { S: data.Items[0].email.S }
        },
        AttributeUpdates: {
          isVerified: {
            Action: 'PUT',
            Value: {
              BOOL: true
            }
          }
        }
      };

      return dynamodb.updateItemAsync(params);
    } else {
      return cb(null, {error: 'Invalid verification code.', result: null});
    }
  };

  var params = {
    TableName: process.env.TABLE_NAME,
    ScanFilter: {
      verificationCode: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [ { S: event.code }, ],
      }
    }
  };

  dynamodb.scanAsync(params)
  .then(handleData)
  .then(function(data) {
    return cb(null, {error: null, result: 'Email verified successfully'});})
  .catch(function(e) {
    return cb(new Error('Something went wrong!'));
  });
};

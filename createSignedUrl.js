var cf = require('aws-cloudfront-sign');
var configurations = require('./configurations.js');

var pathToObj = configurations.pathToObj;

var options = {keypairId: configurations.AWS_CLOUDFRONT_ACCCESS_KEY_ID, 
              privateKeyPath: configurations.PATH_TO_AWS_CLOUDFRONT_PRIVATE_KEY,
              expireTime: new Date().getTime() + configurations.EXPIRE_TIME};

var signedUrl = cf.getSignedUrl(configurations.DOMAIN_NAME + pathToObj, options);
console.log('Signed URL: ' + signedUrl);
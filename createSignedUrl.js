var cf = require('aws-cloudfront-sign');

var AWS_CLOUDFRONT_ACCCESS_KEY_ID = '[AWS_CLOUDFRONT_ACCCESS_KEY_ID]';
var PATH_TO_AWS_CLOUDFRONT_PRIVATE_KEY= '[PATH_TO_AWS_CLOUDFRONT_PRIVATE_KEY]'; // examples: ./cloudfrontprivatekey/pk-APKAJ4GCQSDEGBXMMQYQ.pem'
var EXPIRE_TIME = 30000; // in miliseconds 
var DOMAIN_NAME ='[DOMAIN_NAME]'; // examples: https://d1zfw5v74lamk1.cloudfront.net

var pathToObj = '[pathToObj]'; //examples: /origin-images/sample.jpg

var options = {keypairId: AWS_CLOUDFRONT_ACCCESS_KEY_ID, 
              privateKeyPath: PATH_TO_AWS_CLOUDFRONT_PRIVATE_KEY,
              expireTime: new Date().getTime() + EXPIRE_TIME};

var signedUrl = cf.getSignedUrl(DOMAIN_NAME + pathToObj, options);
console.log('Signed URL: ' + signedUrl);
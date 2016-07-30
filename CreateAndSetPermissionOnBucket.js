var fs = require('fs');
var path = require('path');
var async = require('async');
var sharp = require('sharp');
var AWS = require('aws-sdk');
var url = require('url');

var configurations = require('./configurations.js')

AWS.config.update({accessKeyId: configurations.ACCESS_KEY_ID, secretAccessKey: configurations.SECRET_ACCESS_KEY});
AWS.config.region = configurations.REGION; 


function getListOfFiles(folder) {
    /**
     * Return list of absolute paths of files in folder.
     */

    var files = fs.readdirSync(folder);

    return files.map((file, index) => {
        return path.resolve(folder, file);
    });
}

function resizeImages(imageFolder, callback) {
    /**
     *  Resize images to medium and small size.
     */

    var images =  fs.readdirSync(imageFolder);

    async.eachLimit(images, NUMBER_OF_IMAGES_RESIZED_SIMULTANEOUSLY, resizeImageToSmallSize, (err) => {
        if (err) { console.log('Resizing image to small size has error:', err); return callback(err); }
        console.log('Resizing images to small sizes done');

        async.eachLimit(images, NUMBER_OF_IMAGES_RESIZED_SIMULTANEOUSLY, resizeImageToMediumSize, (err) => {
            if (err) { console.log('Resizing image to medium size has error:', err); return callback(err);  }
            console.log('Resizing images to medium sizes done');
            callback();
            });
    });
}

function resizeImageToSmallSize(pathOfOriginImage, callback) {
    resizeImage(
        pathOfOriginImage, 
        SMALL_IMAGE_FOLDER, 
        SMALL_IMAGE_WIDTH, 
        SMALL_IMAGE_HEIGHT, 
        callback
    );
}

function resizeImageToMediumSize(pathOfOriginImage, callback) {
    resizeImage(
        pathOfOriginImage, 
        MEDIUM_IMAGE_FOLDER, 
        MEDIUM_IMAGE_WIDTH, 
        MEDIUM_IMAGE_HEIGHT,
        callback
    );
}

function resizeImage(pathOfOriginImage, destFolder, width, height, callback) {
    /*
     *  Resize image, resized image  is saved to destFolder
     */

    var absolutePathOfDestImage = path.resolve(ORIGIN_IMAGE_FOLDER, pathOfOriginImage);
    var pathOfDestImage = path.resolve(destFolder, pathOfOriginImage);
  
    sharp(absolutePathOfDestImage)
    .resize(width, height)
    .toFile(pathOfDestImage, function(error) {
        if (error) {
            return callback(error);
        } else {
            return callback();
        }
    });
}

function createFolder(folder, callback) {
    if(!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
}

function createSmallAndMediumImageFolder(callback) {
    createFolder(SMALL_IMAGE_FOLDER);
    createFolder(MEDIUM_IMAGE_FOLDER);
    callback(null, ORIGIN_IMAGE_FOLDER);
}

function createBucketPrivate(callback) {
    createBucket(configurations.PRIVATE_BUCKET, 'private', callback);
}

function createBucketPublic(callback) {
    createBucket(configurations.PUBLIC_BUCKET, 'public-read', callback);
}

function createBucket(bucketName, acl, callback) {
    var s3 = new AWS.S3();

    var params = {
        Bucket: bucketName, /* required */
        ACL: acl,
        CreateBucketConfiguration: {
            LocationConstraint: configurations.REGION
        },
    };

    s3.createBucket(params, function(err, data) {
        var bucketAlreadyOwnedByYou = err && err.code === 'BucketAlreadyOwnedByYou';

        /**
         * Your previous request to create the named bucket succeeded and you already own it
         * So that, we do nothing 
         */
        if (!err || bucketAlreadyOwnedByYou) {
            callback();
        }  else {
            callback(err);
        }        
    });
}

function allowAnonymousAccessImagesOnBucketPublic(callback) {
    /**
     * For more information about AWS S3 Bucket Policy, 
     * Ref: https://docs.aws.amazon.com/AmazonS3/latest/dev/example-bucket-policies.html
     */

    var bucketPolicyAllowAnonymousAccessObject = JSON.stringify({
        "Version":"2012-10-17",
        "Statement":[
            {
            "Sid":"AddPerm",
            "Effect":"Allow",
            "Principal": "*",
            "Action":["s3:GetObject"],
            "Resource":["arn:aws:s3:::" + configurations.PUBLIC_BUCKET + "/*"]
            }
        ]
    });

    var params = {
      Bucket: configurations.PUBLIC_BUCKET,
      Policy: bucketPolicyAllowAnonymousAccessObject
    };
    var s3 = new AWS.S3();

    s3.putBucketPolicy(params, function(err, data) {
      if (err) return callback(err);
      callback(); 
    });
}

function uploadFileToAWS3(params, callback) {
    var absolutePathOfFile = params.Key;
    var fd = fs.statSync(absolutePathOfFile);
    var speratedPaths = absolutePathOfFile.split(path.sep);
    var lastIndex = speratedPaths.length;
    var folder = speratedPaths[lastIndex - 2];
    var fileName = speratedPaths[lastIndex - 1];
    var filePath = folder + '/' +  fileName; 

    if (fd.isFile()) {
        var body = fs.createReadStream(absolutePathOfFile);
        var s3obj = new AWS.S3({params: {Bucket: params.Bucket, Key: filePath}});

        s3obj.upload({Body: body})
        .send((err, data) => {
            if (err) {
                callback(err);
            } else {
                var urlFromAWS3 = data.Location;
                var path = url.parse(urlFromAWS3).pathname;

                fs.appendFileSync('urls.txt', urlFromAWS3 + '\n');
                fs.appendFileSync('paths.txt', path + '\n');
                console.log('uploaded', urlFromAWS3);
                callback(null, data);
            }
        });

    } else {
        callback();
    }
}

function uploadOriginImagesToPrivateBucket(callback) {
    
    return uploadImages(
        NUMBER_OF_IMAGES_UPLOADED_SIMULTANEOUSLY, 
        ORIGIN_IMAGE_FOLDER,
        configurations.PRIVATE_BUCKET, 
        callback
    );
}

function uploadSmallImagesToPublicBucket(callback) {

    return uploadImages(
        NUMBER_OF_IMAGES_UPLOADED_SIMULTANEOUSLY, 
        SMALL_IMAGE_FOLDER,
        configurations.PUBLIC_BUCKET, 
        callback
    );
}

function uploadMediumImagesToPublicBucket(callback) {

    return uploadImages(
        NUMBER_OF_IMAGES_UPLOADED_SIMULTANEOUSLY, 
        MEDIUM_IMAGE_FOLDER,
        configurations.PUBLIC_BUCKET, 
        callback
    );
}

function uploadImages(
    numberOfFilesUploadedSimultaneously, 
    imageFoler,
    bucket, 
    callback) {

    /** 
     * Upload images to AWS S3 simultanenously. 
     */

    var images = getListOfFiles(imageFoler);
    var listOfparams = images.map((img, index ) => {
        return {Bucket: bucket, Key: img};
    });

    async.eachLimit(listOfparams, numberOfFilesUploadedSimultaneously, uploadFileToAWS3, (err) => {
        if (err) { console.log('Error occurs while we are uploading files', err); return callback(err); }
        callback();
    });
}

var startTime = new Date();

async.waterfall([
    // createSmallAndMediumImageFolder,
    // resizeImages,
    createBucketPublic,
    createBucketPrivate,
    allowAnonymousAccessImagesOnBucketPublic,
    // uploadSmallImagesToPublicBucket,
    // uploadMediumImagesToPublicBucket,
    // uploadOriginImagesToPrivateBucket,
], function (err, result) {
    if (err) {
        console.log(err);
    }

    var endTime = new Date();
    console.log('Create and set permissions on bucket done')
    console.log('Time-lapse:', (endTime - startTime) / 1000, 'seconds');
});

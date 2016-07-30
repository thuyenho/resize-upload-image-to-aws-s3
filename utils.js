var fs = require('fs');
var path = require('path');
var async = require('async');
var sharp = require('sharp');
var AWS = require('aws-sdk');
var url = require('url');

var configurations = require('./configurations.js');

AWS.config.update({accessKeyId: configurations.ACCESS_KEY_ID, secretAccessKey: configurations.SECRET_ACCESS_KEY});
AWS.config.region = configurations.REGION; 

module.exports = {
    resizeImages: function(listOfFileMetas) {
        /**
         *  Resize images to medium and small size.
         */

        return new Promise((resolve, reject) => {
            var listOfFileMetasOfSmallImages = [];
            var listOfFileMetasOfMediumImages = [];

            async.map(listOfFileMetas, resizeImageToSmallSize, (err, results) => {
                if (err) { reject('Resizing image to small size has error:' +  err);}

                listOfFileMetasOfSmallImages = results;
                console.log('Resizing images to small sizes done');

                async.map(listOfFileMetas, resizeImageToMediumSize, (err, results) => {
                    if (err) { reject('Resizing image to medium size has error:' + err);}

                    listOfFileMetasOfMediumImages = results;
                    console.log('Resizing images to medium sizes done');
                    resolve({
                        listOfMetaOfOriginImages: listOfFileMetas,
                        listOfMetaOfSmallImages: listOfFileMetasOfSmallImages,
                        listOfMetaOfMediumImages: listOfFileMetasOfMediumImages,
                        });
                    });
            });
        });
    },

    addFilePathForAWSS3: function(source, author, objOfMetaFiles) {

        objOfMetaFiles.listOfMetaOfOriginImages = objOfMetaFiles.listOfMetaOfOriginImages.map((metaFile, index) => {
            metaFile.filePathOnAWSS3 = path.join(source, author, configurations.ORIGIN_IMAGE_FOLDER, metaFile.originalFilename);
            return metaFile;
        });

        objOfMetaFiles.listOfMetaOfSmallImages = objOfMetaFiles.listOfMetaOfSmallImages.map((metaFile, index) => {
            metaFile.filePathOnAWSS3 = path.join(source, author, configurations.SMALL_IMAGE_FOLDER, metaFile.originalFilename);
            return metaFile;
        });

        objOfMetaFiles.listOfMetaOfMediumImages = objOfMetaFiles.listOfMetaOfMediumImages.map((metaFile, index) => {
            metaFile.filePathOnAWSS3 = path.join(source, author, configurations.MEDIUM_IMAGE_FOLDER, metaFile.originalFilename);
            return metaFile;
        });

        return objOfMetaFiles;
    },

    uploadImages: function(objOfMetaFiles) {

        return new Promise((resolve, reject) => {
            var listOfURLsOfOriginalImages = [];
            var listOfURLsOfSmallImages = [];
            var listOfURLsOfMediumImages = [];

            async.map(objOfMetaFiles.listOfMetaOfOriginImages, UploadOriginalImage, (err, results) => {
                if (err) { reject('Uploading original images has error:' +  err);}
                listOfURLsOfOriginalImages = results;
                console.log('Uploading original images to  done');

                async.map(objOfMetaFiles.listOfMetaOfSmallImages, UploadSmallImage, (err, results) => {
                    if (err) { reject('Uploading small images has error:' +  err);}

                    listOfURLsOfSmallImages = results;
                    console.log('Uploading small images to  done');

                    async.map(objOfMetaFiles.listOfMetaOfMediumImages, UploadMediumImage, (err, results) => {
                        if (err) { reject('Uploading medium images has error:' +  err);}

                        listOfURLsOfMediumImages = results;
                        console.log('Uploading medium images to  done');
                        resolve({
                            listOfURLsOfOriginalImages,
                            listOfURLsOfSmallImages,
                            listOfURLsOfMediumImages,
                            });
                        });
                });
            });
        });
    }
}


function resizeImageToSmallSize(fileMeta, callback) {
    resizeImage(
        fileMeta, 
        'small_',
        configurations.SMALL_IMAGE_WIDTH, 
        configurations.SMALL_IMAGE_HEIGHT,
        callback
    );
}

function resizeImageToMediumSize(fileMeta, callback) {
    resizeImage(
        fileMeta, 
        'medium_',
        configurations.MEDIUM_IMAGE_WIDTH, 
        configurations.MEDIUM_IMAGE_WIDTH,
        callback
    );
}

function resizeImage(fileMeta, prefixImage, width, height, callback) {
    var absolutePathOfOriginalImage = fileMeta.path;
    var fileName = path.basename(absolutePathOfOriginalImage);
    var dir = path.dirname(absolutePathOfOriginalImage);
    var destFileName = prefixImage + fileName;
    var absolutePathOfResizedImage = path.join(dir, destFileName);
  
    sharp(absolutePathOfOriginalImage)
    .resize(width, height)
    .toFile(absolutePathOfResizedImage, function(error) {
        if (error) {
            return callback(error);
        } else {
            return callback(null, {
                                    originalFilename: fileMeta.originalFilename,
                                    path: absolutePathOfResizedImage
                                  });
        }
    });
}

function UploadOriginalImage(fileMeta, callback) { 
    return uploadImages(fileMeta, configurations.PRIVATE_BUCKET, callback);
}

function UploadSmallImage(fileMeta, callback) {
    return uploadImages(fileMeta,configurations.PUBLIC_BUCKET, callback);
}

function UploadMediumImage(fileMeta, callback) {
    return uploadImages(fileMeta, configurations.PUBLIC_BUCKET, callback);
}

function uploadImages(
    fileMeta,
    bucket,
    callback
    ) {
    var fileMeta = {Bucket: bucket, Key: fileMeta.filePathOnAWSS3, path: fileMeta.path};
    uploadFileToAWS3(fileMeta, callback);
}


function uploadFileToAWS3(params, callback) {
    var fd = fs.statSync(params.path);
    if (fd.isFile()) {
        var body = fs.createReadStream(params.path);
        var s3obj = new AWS.S3({params: {Bucket: params.Bucket, Key: params.Key}});

        s3obj.upload({Body: body})
        .send((err, data) => {
            if (err) {
                callback(err);
            } else {
                var urlFromAWS3 = data.Location;
                var path = url.parse(urlFromAWS3).pathname;
                callback(null, urlFromAWS3);
            }
        });

    } else {
        callback();
    }
}
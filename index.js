
var fs = require('fs');
var path = require('path');
var async = require('async');
var sharp = require('sharp');
var AWS = require('aws-sdk');
 

var ORIGIN_IMAGE_FOLDER = 'origin-images';

var SMALL_IMAGE_FOLDER = 'small-images';
var SMALL_IMAGE_WIDTH = 200;
var SMALL_IMAGE_HEIGHT = 200;

var MEDIUM_IMAGE_FOLDER = 'medium-images';
var MEDIUM_IMAGE_WIDTH = 400;
var MEDIUM_IMAGE_HEIGHT = 400;

var NUMBER_OF_IMAGES_RESIZED_SIMULTANEOUSLY = 10;
var NUMBER_OF_IMAGES_UPLOADED_SIMULTANEOUSLY = 10;

var ACCESS_KEY_ID = 'ACCESS_KEY_ID';
var SECRET_ACCESS_KEY ='ACCESS_KEY_ID'; 
var BUCKET = 'BUCKET';

AWS.config.update({accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY});
AWS.config.region = 'ap-southeast-1';  


function getListOfFiles(folder) {
    /*
     * eturn list of absolute paths of files in folder.
     */

    var files = fs.readdirSync(folder);

    return files.map((file, index) => {
        return path.resolve(folder, file);
    });
}

function resizeImages(imageFolder, callback) {
    /*
     *  Resize images to medium and small size.
     */

    var images =  fs.readdirSync(imageFolder);

    async.eachLimit(images, NUMBER_OF_IMAGES_RESIZED_SIMULTANEOUSLY, resizeImageToSmallSize, (err) => {
        if (err) { console.log('Resizing image to small size has error:', err); return callback(err); }
        console.log('Resizing images to small sizes done');

        async.eachLimit(images, NUMBER_OF_IMAGES_RESIZED_SIMULTANEOUSLY, resizeImageToMediumSize, (err) => {
            if (err) { console.log('Resizing image to medium size has error:', err); return callback(err);  }
            console.log('Resizing images to medium sizes done');

            callback(
                null, 
                NUMBER_OF_IMAGES_UPLOADED_SIMULTANEOUSLY,
                ORIGIN_IMAGE_FOLDER,
                SMALL_IMAGE_FOLDER,
                MEDIUM_IMAGE_FOLDER);
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

    var absoluteathOfDestImage = path.resolve(ORIGIN_IMAGE_FOLDER, pathOfOriginImage);
    var pathOfDestImage = path.resolve(destFolder, pathOfOriginImage);
  
    sharp(absoluteathOfDestImage)
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

function uploadFileToAWS3(absolutePathOfFile, callback) {
    var fd = fs.statSync(absolutePathOfFile);
    var speratedPaths = absolutePathOfFile.split(path.sep);
    var lastIndex = speratedPaths.length;
    var folder = speratedPaths[lastIndex - 2];
    var fileName = speratedPaths[lastIndex - 1];
    var filePath = folder + '/' +  fileName; 

    if (fd.isFile()) {
        var body = fs.createReadStream(absolutePathOfFile);
        var s3obj = new AWS.S3({params: {Bucket: BUCKET, Key: filePath}});

        s3obj.upload({Body: body})
        .send((err, data) => {
            if (err) {
                callback(err);
            } else {
                console.log('uploaded', data.Location)
                callback(null, data);
            }
        });

    } else {
        callback();
    }
}

function uploadImages(
    numberOfFilesUploadedSimultaneously, 
    originImageFoler, 
    smallImageFolder, 
    mediumImageFolder, 
    callback) {
    /* 
     *  Upload images to AWS S3 simultanenously. 
     */

    var imagesInOriginImageFoler = getListOfFiles(originImageFoler);
    var imagesInSmallImageFoler = getListOfFiles(smallImageFolder);
    var imagesInMediumImageFoler = getListOfFiles(mediumImageFolder);
    var allImages = imagesInOriginImageFoler.concat(imagesInSmallImageFoler, imagesInMediumImageFoler);

    async.eachLimit(allImages, numberOfFilesUploadedSimultaneously, uploadFileToAWS3, (err) => {
        if (err) { console.log('Error occurs while we are uploading files', err); return callback(err); }
        callback(null, allImages);
    });
}

var startTime = new Date();

async.waterfall([
    createSmallAndMediumImageFolder,
    resizeImages,
    uploadImages,
], function (err, result) {
    var endTime = new Date();
    console.log('Total of files has just uploaded successful:', result.length);
    console.log('Time-lapse:', (endTime - startTime) / 1000, 'seconds');
});














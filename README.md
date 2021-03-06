
First you must follow the steps to running `CreateAndSetPermissionOnBucket.js` and after that `httpServer.js` or `createSignedUrl.js`


# 1. the script CreateAndSetPermissionOnBucket.js

## How does this script work

You should run the script `CreateAndSetPermissionOnBucket.js` and that does the following steps:

1. Create two AWS 3 buckets: one for public and the other for private

2. Grant Read-Only Permission to an Anonymous User on public bucket

## Steps to work on this script
	
### Prerequisites

- C++11 compatible compiler such as gcc 4.8+, clang 3.0+ or MSVC 2013+

- Node >= v4.4.7

- Installing Libvips:

	- Linux and Windows: libvips and its dependencies are fetched and stored within node_modules/sharp/lib during npm install

	- Mac OS: brew install homebrew/science/vips, for WebP suppport use: brew install homebrew/science/vips --with-webp

### Configurations

Take a look into `configurations.js` and edit the values of some variables:

- ORIGIN_IMAGE_FOLDER: string containing the path to original image folder

- SMALL_IMAGE_FOLDER: string containing the path to small image folder

- SMALL_IMAGE_WIDTH: number of pixels wide of small image

- SMALL_IMAGE_HEIGHT: number of pixels height of small image

- MEDIUM_IMAGE_FOLDER: string containing the path to medium image folder

- MEDIUM_IMAGE_WIDTH: number of pixels wide of medium image

- MEDIUM_IMAGE_HEIGHT: number of pixels wide of medium image

- NUMBER_OF_IMAGES_RESIZED_SIMULTANEOUSLY: number of images will be resized simutaneously

- NUMBER_OF_IMAGES_UPLOADED_SIMULTANEOUSLY: number of images will be uploaded to AWS S3 simutaneously

- ACCESS_KEY_ID: access key id get from AWS S3

- SECRET_ACCESS_KEY: secret key get from AWS S3

- PRIVATE_BUCKET: name of AWS S3 Private Bucket

- PUBLIC_BUCKET: name of AWS S3 Public Bucket

### Running script

Run `npm install` and `node CreateAndSetPermissionOnBucket.js`, then it will generate two AWS S3 bucket: public and private

# 2. the script httpServer.js

You should run the script `node httpServer.js` and that does the following steps:

1. Create web server listen on port 8080 (localhost:8080)

2. Receive photos from http protocol

3. Resize original photos into small and medium sizes

4. Upload photos to AWS S3


# 3. the script createSignedUrl.js

## Steps to work on this script
	
### Prerequisites

Creating the public CloudFront distribution, configure your origin with the settings:

**Origin Domain Name:** your public AWS S3 bucket

Creating the private CloudFront distribution, configure your origin with the settings:

**Origin Domain Name:** your private AWS S3 bucket

**Restrict Bucket Access:** Yes

**Grant Read Permissions on Bucket:** Yes, Update Bucket Policy

**Trusted Signers:** Self

### Configurations

Take a look into `configurations.js` and edit the values of some variables:

- AWS_CLOUDFRONT_ACCCESS_KEY_ID: the access key ID from your Cloudfront keypair

- PATH_TO_AWS_CLOUDFRONT_PRIVATE_KEY: path to the .pem file. the private key from your Cloudfront keypair

- EXPIRE_TIME: the time in miliseconds when the URL should expire

- DOMAIN_NAME: domain name of private CloundFront (format: xxxx.cloudfront.net)

- pathToObj: path to photo

### Running script

Run `node createSignedUrl.js`, then it will generate signed url to private images

## Features

- Convert large images in common formats to smaller, web-friendly JPEG, PNG and WebP images of varying dimension

- Upload multi images to AWS S3 simutanenously 

- Generate signed URLs to private images

## TODO

- Creating an Origin Access Identity and Adding it to Your Distribution Using the CloudFront API

- Refactor code with detail comments


## References

- [sharp node module](http://sharp.dimens.io/en/stable/) 

- [aws-sdk node module](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-examples.html)

- [bucket-policies](https://docs.aws.amazon.com/AmazonS3/latest/dev/example-bucket-policies.html)
## Introduction

## How does this script work

You should run the script index.js and that does the following:

1. Read list of files in image folder

2. Create small and medium images from original image

3. Upload images (including original, small and medium images) to AWS S3 

4. Write URL image on file 

## Steps to work on this script
	

### Prerequisites

- C++11 compatible compiler such as gcc 4.8+, clang 3.0+ or MSVC 2013+

- Node >= v4.4.7

- Installing Libvips:

	- Linux and Windows: libvips and its dependencies are fetched and stored within node_modules/sharp/lib during npm install
	
	- Mac OS: brew install homebrew/science/vips, for WebP suppport use: brew install homebrew/science/vips --with-webp

### Configurations

Take a look into `index.js` and edit values of variables:

- ORIGIN_IMAGE_FOLDER: string containing the path to original image folder

- SMALL_IMAGE_FOLDER: string containing the path to small image folder

- SMALL_IMAGE_WIDTH: number of pixels wide of small image

- SMALL_IMAGE_HEIGHT: number of pixels height of small image

- MEDIUM_IMAGE_FOLDER: string containing the path to small image folder

- MEDIUM_IMAGE_WIDTH: number of pixels wide of medium image

- MEDIUM_IMAGE_HEIGHT: number of pixels wide of medium image

- NUMBER_OF_IMAGES_RESIZED_SIMULTANEOUSLY: number of images will be resized simutaneously

- NUMBER_OF_IMAGES_UPLOADED_SIMULTANEOUSLY: number of images will be uploaded to AWS S3 simutaneously

- ACCESS_KEY_ID: access key id get from AWS S3

- SECRET_ACCESS_KEY: secret key get from AWS S3

- BUCKET: name of AWS S3 Bucket

### Running script

Run `node index.js`, then it will generate a new file urls.text and paths.txt in your working directory.

## Features

- Convert large images in common formats to smaller, web-friendly JPEG, PNG and WebP images of varying dimension

- Upload multi images to AWS S3 simutanenously 

## References

- [sharp node module](http://sharp.dimens.io/en/stable/) 
- [aws-sdk node mdule](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-examples.html)
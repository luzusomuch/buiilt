var s3 = require('s3'),
  config = require('../config/environment');

function s3Aws() {
  this.client = s3.createClient({
    maxAsyncS3: 20, // this is the default
    s3RetryCount: 3, // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
      accessKeyId: config.s3Options.accessKeyId,
      secretAccessKey: config.s3Options.secretAccessKey
        // any other options are passed to new AWS.S3()
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    }
  });
}

//create s3 client
s3Aws.createClient = function () {
  return new s3Aws();
};

//get public http url
s3Aws.prototype.getPublicUrl = function (key) {
  return s3.getPublicUrlHttp(config.Bucket, key);
};

s3Aws.prototype.uploadFile = function (file, callback) {
  var self = this.client;
  var uploader = self.uploadFile({
    localFile: file.path,
    s3Params: {
      Bucket: config.Bucket,
      Key: file.title,
      ACL: 'public-read'
    }
  });
  uploader.on('error', function (err) {
    callback(err);
  });
  uploader.on('end', function (data) {
    callback(null, data);
  });
};

//download from s3
s3Aws.prototype.downloadFile = function(file, callback) {
  var self = this.client;
  var downloader = self.downloadFile({
    localFile: file.path,
    s3Params: {
      Bucket: config.Bucket,
      Key: file.title
    }
  });
  downloader.on('error', function(err) {
    callback(err);
  });
  downloader.on('end', function(data) {
    callback(data);
  });
};
module.exports = new s3Aws();
/**
 * upload image which use croppic or upload directly from form-data
 */
var Cloudinary = require('./Cloudinary');
var gm = require('gm');
var Busboy = require('busboy');

/**
 * Cloudinary upload
 */
exports.upload = function(req, cb){
  var busboy = new Busboy({ headers : req.headers });
  var fields = {};
  var isMultipart = false;
  var returnCb = function(err, data){
    if(err){ return cb(err); }
    if(fields.imgUrl){ delete fields.imgUrl; }
    cb(null, {
      fields: fields,
      cloudinary: data
    });
  };

  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
    //TODO - resize multi file
    fields[fieldname] = val;
  });
  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    //check mimetype is image
    isMultipart = true;

    Cloudinary.uploadStream(file, returnCb);
  });
  busboy.on('finish', function() {
    //check is valid file or has base64 image data
    if(fields.imgUrl){
      var binaryData = new Buffer(fields.imgUrl.replace(/^data:image\/[^;]*;base64,?/,''), 'base64');
      gm(binaryData, 'image.png')
      .options({ imageMagick: true })
      .resize(fields.imgW, fields.imgH)
      .rotate('white', fields.rotation)
      .crop(fields.cropW, fields.cropH, fields.imgX1, fields.imgY1)
      .stream('png', function (err, stdout, stderr) {
        if(err){ return cb(err); }

        Cloudinary.uploadStream(stdout, returnCb);
      });
    }else if(isMultipart){
      //donothing here
      return;
    }else{
      cb('No image found!');
    }
  });
  req.pipe(busboy);
};
var _ = require('lodash'),
    mongoose = require('mongoose'),
    defaultOptions = {
      crop: 'fill'
    };

function createObject(key, value) {
  var obj = {};
  obj[key] = value;
  return obj;
}

module.exports.createObject = createObject;

function isObjectId(token) {
  return mongoose.Types.ObjectId.isValid(token);
};

module.exports.isObjectId = isObjectId;

function toObjectId(id) {
  return isObjectId(id) ? mongoose.Types.ObjectId(id) : null;
};
module.exports.toObjectId = toObjectId;

module.exports.sanitizeAttributes = function(attributes) {
  _.each(attributes, function(value, key) {
    try {
      var data = JSON.parse(value);
      if (!data.value) {
        return delete attributes[key];
      }
      attributes[key] = data.type === 'number' ? parseFloat(data.value) : data.value ? new RegExp(data.value, 'ig') : undefined;
    } catch (e) {
    }
  });

  return attributes;
};

module.exports.getParams = function(prefix, param, objName) {
  var prefix = prefix || '',
    objName = objName || '_id',
    params = [createObject(prefix + 'alias', param)];

  if (isObjectId(param)) {
    params.push(createObject(prefix + objName, toObjectId(param)));
  }
  return params;
};

module.exports.enhanceMedia = function(source, options) {
  var options = options ? _.defaults(options, defaultOptions) : defaultOptions
          , imgRegexp = /((?:https?):\/\/\S*\.(?:gif|jpg|jpeg|tiff|png|svg|webp))/gi;

  // emoji
  source = emojify.replace(source, function(emoji, name) {
    var width = 16
            , tag = options.tag;

    return "<img title=':" + name + ":' alt=':" + name + ":' class='emoji' width='" + width + "' src='" + emojiImgDir + '/' + name + ".png' align='middle' />";
  });

  // images
  if (!options.denyImageLinks) {
    source = source.replace(imgRegexp, '<div class="landing-bet-media"><a href="$1" target="_blank">' + '<img alt="image" width="' + options.width + '" src="$1"/></a></div>');
  } else {
    source = source.replace(imgRegexp, '<div class="landing-bet-media"><img alt="image" width="' + options.width + '" src="$1"/></div>');
  }

  // videos
  source = source.replace(/((?:https?):\/\/\S*\.(?:ogv|webm))/gi, '<video src="$1" width="' + options.width + '" controls preload="none"></video>');

  // youtube
  source = source.replace(/https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/ytscreeningroom\?v=|\/feeds\/api\/videos\/|\/user\S*[^\w\-\s]|\S*[^\w\-\s]))([\w\-]{11})[?=&+%\w-]*/gi, '<iframe src="https://www.youtube.com/embed/$1?rel=0" width="' + (options.videoWidth || options.width) + '" height="' + (options.videoHeight || options.height) + '" frameborder="0" allowfullscreen></iframe>');

  // vimeo
  source = source.replace(/https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/gi, '<iframe src="//player.vimeo.com/video/$3?title=0&amp;byline=0&amp;portrait=0&amp;badge=0" frameborder="0" width="' + options.width + '" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');

  // new lines
  source = source.replace('/\n/g', '<br/>').replace(/&#10;/g, '<br/>');

  // links
  if (!options.denyLinks) {
    source = source.replace(/((href|src)=["']|)(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, function() {
      var anchor = arguments[3] && arguments[3].length ? arguments[3].substring(0, 50) + '..' : '';
      return  arguments[1] ?
              arguments[0] :
              '<a target="_blank" href="' + arguments[3] + '">' + anchor + '</a>';
    });
  }

  return source;
};

module.exports.getVideoServer = function(url) {
  if (url.indexOf('youtube') !== -1) {
    return 'youtube';
  } else if (url.indexOf('vimeo') !== -1) {
    return 'vimeo';
  } else {
    return null;
  }
};

module.exports.getVideoId = function(url) {
  if (url.indexOf('youtube') !== -1) {
    var videoid = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    return videoid ? videoid[1] : null;
  } else if (url.indexOf('vimeo') !== -1) {
    var videoid = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
    return videoid ? videoid[3] : null;
  } else {
    return null;
  }
};

module.exports.getEmbededVideoFromId = function(server, id) {
  switch (server) {
    case 'youtube':
      return 'https://www.youtube.com/embed/' + id;
    case 'vimeo':
      return 'http://player.vimeo.com/video/' + id;
  }
};

module.exports.getVideoPhotoFromId = function(server, id) {
  switch (server) {
    case 'youtube':
      return 'http://img.youtube.com/vi/' + id + '/default.jpg';
    case 'vimeo':
      return 'http://player.vimeo.com/video/' + id;
  }
};

function decodeCookie(string) {
  var cookieParts = string.split(';'),
      cookies = {};

  for (var i = 0; i < cookieParts.length; i++) {
    var name_value = cookieParts[i],
    equals_pos = name_value.indexOf('='),
    name = decodeURI(name_value.slice(0, equals_pos)).trim(),
    value = decodeURI(name_value.slice(equals_pos + 1));

    cookies[':' + name] = value;
  }

  return cookies;
}

/**
 * get cookie by name which sent to rabbitmq
 * @returns {String}
 */
module.exports.getCookieFromMessage = function(message, name){
  if(!_.isObject(message) || !message.cookie){ return null; }

  var cookies = decodeCookie(message.cookie);

  return cookies[':' + name];
};

/**
 * get language (isoCode) from cookie or message, if lanaguage is not passed, get default language
 *
 * @param {Object} message
 * @returns {String}
 */
module.exports.getLanguage = function(message){
  //get language from request body, query then cookie
  if(message.data && message.data.language){ return message.data.language; }
  //get from query
  if(message.query && message.query.language){ return message.query.language; }

  //get from cookie
  var lang = this.getCookieFromMessage(message, 'language');
  return !lang ? 'en' : this.getCookieFromMessage(message, 'language').toString().replace(/\"/g, '');
};
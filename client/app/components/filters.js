angular.module('buiiltApp')
.filter('removeSpaces', function() {
  return function(string) {
    return angular.isDefined(string) ? string.replace(/\s/g, '') : '';
  };
})
.filter('fromNow', function() {
  return function(string) {
    return angular.isDefined(string) ? moment(string).fromNow() : '';
  };
})
.filter('elipsis', function() {
  return function(string, count) {
    if (angular.isDefined(string)) {
      return string.length > count ? string.substring(0, count) + '...' : string;
    } else {
      return '';
    }
  };
})
.filter('ucFirst', function() {
  return function(string) {
    return angular.isDefined(string) ? string.charAt(0).toUpperCase() + string.slice(1) : '';
  };
})
.filter('linkify', function () {
  return function (text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp, '<a href="$1" target="_blank">$1</a>');
  };
})
.filter('htmlToPlaintext', function() {
  return function(text) {
    return String(text).replace(/<[^>]+>/gm, '');
  };
})
.filter('phoneNumber', function() {
  return function(str) {
    if(typeof str !== 'string'){ return ''; }

    //format number
    var rawNumber = str.replace(/[^0-9]/g,'');
    var regex = /^1?([2-9]..)([2-9]..)(....)$/;

    return rawNumber.replace(regex,'($1) $2 $3');
  };
})
.filter('decimal', function () {
    return function (input, places) {
      return !isNaN(input) ? parseFloat(input).toFixed(places) : input;
    };
  }
)
.filter('age', function(){
  return function(input, defaultText){
    defaultText = defaultText || 'Unknown';
    if(!input){return 'Unknown'; }
    else{
      var birthdate = new Date(input);
      var cur = new Date();
      var diff = cur-birthdate; // This is the difference in milliseconds
      return Math.floor(diff/31536000000); // Divide by 1000*60*60*24*365
    }
  };
})
.filter('avatar', function(){
  return function(user){
    if(!_.isObject(user) || !user.avatar){
      return '/assets/img/default-profile.jpg';
    }

    return user.avatar;
  };
})
.filter('threadUsers', function () {
    return function (users) {
      var result = "";
      _.forEach(users,function(user) {
        result += user.name + " , "
      });
      return result.substr(0,result.length -3 );
    };
  }
)
.filter('name', function () {
    return function (user) {
      if (user) {
        return user.firstName + ' ' + user.lastName;
      }
    };
  }
)
.filter('taskFilter', function() {
  return function (items,filterType) {
    var filtered = [];
    angular.forEach(items, function(item) {
      if (filterType == 'all') {
        if (!item.completed) {
          filtered.push(item);
        }
      } else if (filterType == 'completed') {
        if (item.completed) {
          filtered.push(item);
        }
      } else {
        if (_.find(item.assignees,{_id : filterType.myTask})) {
          if (!item.completed) {
            filtered.push(item);
          }
        }
      }
    });
    return filtered;
  }
});
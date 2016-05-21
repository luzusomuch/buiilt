angular.module('buiiltApp').controller('appCtrl', function($rootScope, deviceDetector) {
    $rootScope.title = "App Page";
    var raw = deviceDetector.raw;
    if (raw.os.android) {
        window.location.href = "https://play.google.com/store/apps/details?id=com.buiilt.hoanvu";
    } else if (raw.os.ios) {
        window.location.href = "https://itunes.apple.com/us/app/buiilt/id1036694486?l=vi&ls=1&mt=8";
    } else {
        window.location.href="/signin";
    }
});
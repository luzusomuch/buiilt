angular.module('buiiltApp').controller('DocumentDetailBackendCtrl', function($scope, document) {
    $scope.document = document;
    if (document.members.length > 0 || document.notMembers.length > 0) {
        $scope.assignees = document.members;
        _.each(document.notMembers, function(email) {
            $scope.assignees.push({email: email});
        });
    }

    $scope.download = function() {
        filepicker.exportFile(
            {url: document.path, filename: document.name},
            function(Blob){
                console.log(Blob.url);
            }
        );
    };
});
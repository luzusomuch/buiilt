angular.module('buiiltApp')
.controller('UserBackendDetailProjectCtrl', function($state, $stateParams, $rootScope, $scope, $mdDialog, $mdToast, people, tasks, messages, files, documents) {
    $scope.showToast = function(value) {
        $mdToast.show($mdToast.simple().textContent(value).position('bottom','left').hideDelay(3000));
    };

    $scope.result = {
        datas : []
    };

    function getProjectMembers(people) {
        $scope.result.type = "members";
        var datas = [];
        var roles = ["builders", "clients", "architects", "subcontractors", "consultants"];
        _.each(roles, function(role) {
            _.each(people[role], function(tender) {
                if (tender.tenderers[0]._id) {
                    tender.tenderers[0]._id.type = role;
                    datas.push(tender.tenderers[0]._id);
                    _.each(tender.tenderers[0].teamMember, function(member) {
                        member.type = role;
                        datas.push(member);
                    });
                } else {
                    datas.push({email: tender.tenderers[0].email, type: role});
                }
            });
        });
        $scope.result.datas = datas;
    };

    getProjectMembers(people);

    $scope.filterTags = [{text: "members", select: true},{text: "tasks"},{text: "messages"},{text: "files"},{text: "documents"}];

    $scope.selectFilterTag = function(index) {
        $scope.result.datas = [];
        _.each($scope.filterTags, function(tag) {
            tag.select = false;
        });
        $scope.filterTags[index].select = true;
        $scope.result.type = $scope.filterTags[index].text;
        if ($scope.result.type==="members") {
            getProjectMembers(people);
        } else if ($scope.result.type==="tasks") {
            $scope.result.datas = tasks;
        } else if ($scope.result.type==="messages") {
            $scope.result.datas = messages;
        } else if ($scope.result.type==="files") {
            $scope.result.datas = files;
        } else {
            $scope.result.datas = documents;
        }
    };

    $scope.openUserDetail = function(user) {
        if (user._id) 
            $state.go("userBackendDetail.projectsAndTenders", {userId: user._id});
    };  

});
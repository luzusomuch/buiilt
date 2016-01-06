angular.module('buiiltApp').controller('dashboardCtrl', function($rootScope, $scope, $timeout, $q, $state, projectService, myTasks, myMessages, myFiles) {
	$rootScope.title = "Dashboard";
	$scope.myTasks = myTasks;
	$scope.myMessages = myMessages;
	$scope.myFiles = myFiles;
	$scope.search = false;
	// type can be a task, message, file or document
	var type = $state.current.name.split(".")[1];
    
	
	//Placeholder Set of Filters to use for layout demo
	$scope.dashboardFilters = [];
	$scope.querySearch = function(value) {
		if (type === 'tasks') {
			var tasks = angular.copy($scope.myTasks);
        	var results = value ? tasks.filter(createFilter(value)) : [];
		} else if (type === 'messages') {
			var messages = angular.copy($scope.myMessages);
        	var results = value ? messages.filter(createFilter(value)) : [];
		} else if (type === 'files') {
			var files = angular.copy($scope.myFiles);
        	var results = value ? files.filter(createFilter(value)) : [];
		} else if (type === 'documentation') {
			var files = angular.copy($scope.myFiles);
        	var results = value ? files.filter(createFilter(value)) : [];
		}
        $rootScope.filterResults = results;
        filterByProject(results);
        return results;
    };

    if ($rootScope.filterResults && $rootScope.filterResults.length > 0) {
    	filterByProject($rootScope.filterResults);
    }

    if ($rootScope.dashboardFilters && $rootScope.dashboardFilters.length > 0) {
    	$scope.search = true;
    	$scope.dashboardFilters = $rootScope.dashboardFilters;
    	_.each($scope.dashboardFilters, function(item) {
    		if (item) {
    			$scope.querySearch(item.project.name)
    		}
    	});
    }

    function createFilter(query) {
        return function filterFn(item) {
        	return item.project.name.toLowerCase().indexOf(query) > -1;
        };
    };

    function filterByProject(results) {
    	$scope.results = [];
    	if (type === 'tasks') {
    		_.each($scope.myTasks, function(task) {
    			if (_.last(results)) {
		        	if (task.project._id.toString() === _.last(results).project._id.toString()) {
		        		$scope.results.push(task);
		        	}
    			}
	        });
    	} else if (type === 'messages') {
    		_.each($scope.myMessages, function(message) {
    			if (_.last(results)) {
		        	if (message.project._id.toString() === _.last(results).project._id.toString()) {
		        		$scope.results.push(message);
		        	}
    			}
	        });
    	} else if (type === 'files') {
    		_.each($scope.myFiles, function(file) {
    			if (_.last(results)) {
		        	if (file.project._id.toString() === _.last(results).project._id.toString()) {
		        		$scope.results.push(file);
		        	}
    			}
	        });
    	} else if (type === 'documentation') {
    		_.each($scope.myFiles, function(file) {
    			if (_.last(results)) {
		        	if (file.project._id.toString() === _.last(results).project._id.toString()) {
		        		$scope.results.push(file);
		        	}
    			}
	        });
    	}
    };

    $scope.addChip = function() {
        $scope.search = true;
        $rootScope.dashboardFilters = $scope.dashboardFilters;
    };

    $scope.removeChip = function() {
        if ($rootScope.dashboardFilters.length === 0) {
            $scope.search = false;
        }
    };

    $scope.selectedChip = function(chip) {
        $scope.results = [];
        $scope.search = true;
        var user = $rootScope.currentUser;
        if (chip.place === "task") {
            switch (chip.value) {
                case "assignedToMe":
                    _.each($scope.myTasks, function(task) {
                        if (_.findIndex(task.assignees, function(assignee) {
                            return assignee._id == user._id;
                        }) !== -1) {
                            $scope.results.push(task);
                        }
                    });
                break;

                case "assignedByMe":
                    _.each($scope.myTasks, function(task) {
                        if (task.user && task.user._id == user._id) {
                            $scope.results.push(task);
                        }
                    });
                break;

                case "dueToDay":
                    _.each($scope.myTasks, function(task) {
                        if (moment(moment(task.dateEnd).format("YYYY-MM-DD")).isSame(moment(new Date()).format("YYYY-MM-DD"))) {
                            $scope.results.push(task);
                        }
                    });
                break;

                case "dueTomorrow":
                    var tomorrow = moment(new Date()).add(1, "days").format("YYYY-MM-DD");
                    _.each($scope.myTasks, function(task) {
                        var dateEnd = moment(task.dateEnd).format("YYYY-MM-DD");
                        if (moment(dateEnd).isSame(tomorrow)) {
                            $scope.results.push(task);
                        }
                    });
                break;

                case "dueThisWeek":
                    _.each($scope.myTasks, function(task) {
                        var currentWeek = getWeek(new Date());
                        _.each(currentWeek, function(day) {
                            if (moment(moment(new Date(day)).format("YYYY-MM-DD")).isSame(moment(new Date(task.dateEnd)).format("YYYY-MM-DD"))) {
                                $scope.results.push(task);
                            }
                        });
                    });
                break;

                default:
                break;
            }
        } else if (chip.place === "message") {
            switch (chip.value) {
                case "createdByMe":
                    _.each($scope.myMessages, function(item) {
                        if (item.owner == user._id) {
                            $scope.results.push(item);
                        }
                    });
                break;

                case "mentionsMe":
                    _.each($scope.myMessages, function(item) {
                        if (item.messages.length > 0) {
                            _.each(item.messages, function(message) {
                                if (message.mentions && message.mentions.length > 0) {
                                    if (_.indexOf(message.mentions, user._id) !== -1) {
                                        $scope.results.push(item);
                                        return false;
                                    }
                                }
                            });
                        }
                    });
                break;

                default:
                break;
            }
        }
    };

    $scope.messageChips = [
        {place: "message", value: "createdByMe", text: "CREATED BY ME"},
        {place: "message", value: "mentionsMe", text: "MENTIONS ME"}
    ];
    $scope.taskChips = [
        {place: "task", value: "assignedToMe", text: "Assigned to Me"},
        {place: "task", value: "assignedByMe", text: "Assigned by Me"},
        {place: "task", value: "dueToDay", text: "Due Today"},
        {place: "task", value: "dueTomorrow", text: "Due Tomorrow"},
        {place: "task", value: "dueThisWeek", text: "Due This Week"}
    ];
    $scope.fileChips = [
        {place: "file", value: "mine", text: "Mine"},
        {place: "file", value: "myTeam", text: "My Teams"}
    ];

    function getWeek(fromDate){
        var sunday = new Date(fromDate.setDate(fromDate.getDate()-fromDate.getDay()))
            ,result = [new Date(sunday)];
        while (sunday.setDate(sunday.getDate()+1) && sunday.getDay()!==0) {
            result.push(new Date(sunday));
        }
        return result;
    }
});
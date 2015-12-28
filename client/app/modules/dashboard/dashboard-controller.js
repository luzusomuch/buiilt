angular.module('buiiltApp').controller('dashboardCtrl', function($rootScope, $scope, $timeout, $q, $state, projectService, myTasks, myMessages, myFiles) {
	$rootScope.title = "Dashboard";
	$scope.errors = {};
	$scope.success = {};
	$scope.user = {};
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
    	$scope.results = []
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
});
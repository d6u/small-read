//= require jquery-2.0.0.min.js
//= require angular.min.js
//= require angular-sanitize.js
//  require angular-resource.js
//  require modules/ng-infinite-scroll.js


// App Init
// ========
var app = angular.module('SmallRead', ['ngSanitize']);

// MainCtrl
// --------
app.controller(
    'AppCtrl',
    function($scope, $http) {
        $scope.loadFoldersAndFeeds = function() {
            $http.get('/bg/load_folders_and_feeds.json')
            .success(function(data) {
                $scope.folders = data;
            });
        };
        $scope.loadFoldersAndFeeds();

        $scope.showFeedsList = function(showList) {
            showList.list = showList.list === "show" ? "" : "show";
        };
        $scope.fetchWithTwitter = function() {
            $http.get('/bg/refresh')
            .success(function(data) {
                $scope.loadFoldersAndFeeds();
            });
        };
    }
);

// Folder
app.directive(
    'folder',
    function() {
        return {
            controller: function($scope) {
                $scope.showList = {
                    list: ""
                };
            },
            link: function(scope, element, attrs) {
            }
        };
    }
);

// Feed
app.directive(
    'feed',
    function() {
        return {
            link: function(scope, element, attrs) {
            }
        };
    }
);

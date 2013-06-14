//= require angular.min.js
//= require angular-resource.js


// App Init
// ========
var app = angular.module('SmallRead', []);

// Service
app.factory(
    'loadTweets',
    function($http) {
        var loadTweets = {
            fetchTweets: function(source_type, source_id, controller_scope) {
                var me = this;
                this.assembleUrl(source_type, source_id);
                $http.get(this.source_url)
                    .success(function(data, status, headers, config) {
                        me.tweets = data;
                    });
            },
            assembleUrl: function(source_type, source_id) {
                this.source_url = '/' + source_type + '/';
                this.source_url += source_id + '/tweets/';
            }
        };
        return loadTweets;
    }
);


// MainCtrl
app.controller(
    'MainCtrl',
    function($scope, loadTweets) {
        $scope.loadTweets = loadTweets;
        $scope.showTweets = function(source_type, source_id) {
            loadTweets.fetchTweets(source_type, source_id, $scope);
        };
    }
);

// Feeds
app.directive(
    "folder",
    function() {
        return {
            controller: function($scope) {
                $scope.show = 'no-show';
                $scope.showFeeds = function() {
                    $scope.show = $scope.show === 'no-show'?'show':'no-show';
                };
            },
            scope: {
                showTweets: '&'
            }
        };
    }
);

// Tweets


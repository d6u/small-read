//= require angular.min.js


// App Init
// ========
var app = angular.module('SmallRead', []);

// Service
app.factory(
    'loadTweets',
    ['$http', function($http) {
        console.log("in loadTweets service");
        var loadTweets = {
            fetchTweets: function(folder_id, controller_scope) {
                // fetch new data
                this.assembleUrl(folder_id);
                $http.get(this.tweetsUrl)
                .success(function(data, status, headers, config) {
                    controller_scope.tweets = data;
                });
            },
            assembleUrl: function(folder_id) {
                this.tweetsUrl = this.baseUrl + folder_id + "/tweets";
            },
            baseUrl: "/folders/",
            tweetsUrl: "/folders/"
        };
        return loadTweets;
    }]
);

// MainCtrl
app.controller(
    'MainCtrl',
    function($scope, loadTweets) {
        $scope.tweets = [];
        $scope.methods = loadTweets;
    }
);

// Feeds
app.directive(
    "folder",
    function() {
        return function(scope, element, attrs) {
            element.bind('click', function() {
                scope.methods.fetchTweets(attrs.folder, scope);
            });
        };
    }
);

// Tweets


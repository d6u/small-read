//= require angular.min.js
//  require angular-sanitize.js
//  require angular-resource.js


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
                        me.tweets = angular.forEach(data, function(value, key) {
                            value.entities = angular.fromJson(value.entities);
                        });
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
app.directive(
    "tweet",
    function($compile) {
        var non_retweet_template = document.querySelector('#tweet-template').innerHTML;
        var retweet_template = document.querySelector('#retweet-template').innerHTML;

        var getTemplate = function(retweeted_status_id_str) {
            if (retweeted_status_id_str) {
                return retweet_template;
            } else {
                return non_retweet_template;
            }
        };

        var link = function(scope, element, attrs) {
            element.html(getTemplate(scope.retweeted_status_id_str));
            $compile(element.contents())(scope);
        };

        return {
            link: link,
            rep1ace: true
        };
    }
);


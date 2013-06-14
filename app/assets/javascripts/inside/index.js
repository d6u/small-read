//= require jquery-2.0.0.min.js
//= require angular.min.js
//= require angular-sanitize.js
//  require angular-resource.js
//= require modules/ng-infinite-scroll.js


// App Init
// ========
var app = angular.module('SmallRead', ['ngSanitize', 'infinite-scroll']);

// MainCtrl
app.controller(
    'MainCtrl',
    function($scope, $http, $attrs) {
        $scope.showTweets = function(source_type, source_id) {
            $scope.baseurl = '/' + source_type + '/';
            $scope.baseurl += source_id + '/tweets/';
            $http.get($scope.baseurl).success(function(data) {
                $scope.tweets = angular.forEach(data, function(value, key) {
                    value.entities = angular.fromJson(value.entities);
                });
                $scope.max_tweet_id = data[data.length - 1].id - 1;
                $scope.reaches_end = data.length < 20 ? true : false;
            });
        };

        $scope.busy = false;
        $scope.scrollToBottom = function() {
            if ($scope.reaches_end || $scope.busy || typeof $scope.tweets === 'undefined') return;
            $scope.busy = true;
            var url = $scope.baseurl + "?max_id=" + $scope.max_tweet_id;
            $http.get(url).success(function(data) {
                for (var i = 0; i < data.length; i++) {
                    data[i].entities = angular.fromJson(data[i].entities);
                    $scope.tweets.push(data[i]);
                }
                if (data.length > 0) $scope.max_tweet_id = data[data.length - 1].id - 1;
                if (data.length < 20) $scope.reaches_end = true;
                $scope.busy = false;
            });
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
            element.html(getTemplate(scope.tweet.retweeted_status_id_str));
            $compile(element.contents())(scope);
        };

        return {
            link: link,
            rep1ace: true
        };
    }
);

app.filter(
    'tweetTextFilter',
    function() {
        return function(input, entities) {
            // extract and sort entities
            var entity_array = [];
            for(var entity in entities) {
                angular.forEach(entities[entity], function(value, key){
                    value.type = entity;
                    entity_array.push(value);
                });
            }
            entity_array.sort(function(a,b){
                if (a.indices && b.indices) return a.indices[0] - b.indices[0];
            });
            // extract input pieces
            var input_pieces = [];
            var beginning_point = 0;
            angular.forEach(entity_array, function(value, key) {
                input_pieces.push(input.slice(beginning_point, value.indices[0]));
                switch (value.type) {
                    case "urls":
                        input_pieces.push('<a href="'+value.expanded_url+'" target="_blank">'+value.display_url+'</a>');
                        break;
                    case "hashtags":
                        input_pieces.push('<a href="https://twitter.com/search?q=%23'+value.text+'&src=hash" target="_blank>#'+value.text+'</a>');
                        break;
                    case "user_mentions":
                        input_pieces.push('<a href="http://twitter.com/'+value.screen_name+'" target="_blank>@'+value.screen_name+'</a>');
                        break;
                    case "medias":
                        input_pieces.push('<a href="'+value.media_url+'" target="_blank>'+value.display_url+'</a>');
                        break;
                }
                beginning_point = value.indices[1];
            });
            input_pieces.push(input.slice(beginning_point));
            // return input
            return input_pieces.join("");
        };
    }
);

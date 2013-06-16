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
        // folder & feed
        $scope.showFeedsList = function(showList) {
            showList.list = showList.list === "show" ? "" : "show";
        };
        $scope.fetchWithTwitter = function() {
            $http.get('/bg/refresh')
            .success(function(data) {
                $scope.loadFoldersAndFeeds();
            });
        };
        // tweets
        $scope.tweets = [];
        $scope.loadTweets = function(type, id) {
            $http.get('/'+type+'s/'+id+'/tweets')
            .success(function(data){
                for (var i = 0; i < data.length; i++) {
                    data[i].entities = angular.fromJson(data[i].entities);
                }
                $scope.tweets = data;
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

//
app.directive(
    'tweet',
    function($compile) {
        var non_retweet_template = document.querySelector('#tweet-template').innerHTML;
        var retweet_template = document.querySelector('#retweet-template').innerHTML;

        var getTemplate = function(retweeted_status_id_str) {
            // TODO: simplify
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
            link: link
        };
    }
);

// Filters
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
                return a.indices[0] - b.indices[0];
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

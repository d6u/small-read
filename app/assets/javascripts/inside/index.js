//= require modules/time-parser.js
//= require jquery-2.X.min.js
//= require angular.min.js
//= require angular-sanitize.js


// App Init
// ========================================
var app = angular.module('SmallRead', ['ngSanitize']);

app.controller('AppCtrl',
    ['$scope', '$http', function($scope, $http) {
        $http.get('/feeds_with_top_tweets')
        .then(function(response) {
            for (var i = 0; i < response.data.length; i++) {
                // parase entities from JSON to object
                response.data[i].coverTweet.entities = angular.fromJson(response.data[i].coverTweet.entities);
                response.data[i].coverTweet.createdAt = parseTime(response.data[i].coverTweet.createdAt);
                for (var j = 0; j < response.data[i].topTweets.length; j++) {
                    response.data[i].topTweets[j].entities = angular.fromJson(response.data[i].topTweets[j].entities);
                    response.data[i].topTweets[j].createdAt = parseTime(response.data[i].topTweets[j].createdAt);
                };
                // inject coverBg for background image
                if (response.data[i].coverTweet.withImage) {
                    response.data[i].coverBg = {
                        backgroundImage: "url(\""+response.data[i].coverTweet.entities.media[0].media_url+":small\")"
                    };
                    response.data[i].coverTextClass = "has-cover-image";
                } else {
                    response.data[i].coverTextClass = (response.data[i].coverTweet.text.length < 100) ? "no-cover-image" : "no-cover-image very-long-text";
                }
            };
            $scope.feeds = response.data;
        });
    }]
);


// Filters
// ========================================
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
                    case "media":
                        input_pieces.push('<a href="'+value.media_url+'" target="_blank>'+value.display_url+'</a>');
                        break;
                }
                beginning_point = value.indices[1];
            });
            // last piece, '140' fix truncated tweet text issue
            input_pieces.push(input.slice(beginning_point, 140));
            // return input
            return input_pieces.join("");
        };
    }
);

app.filter(
    'tweetTimestampFilter',
    function() {
        return function(input) {
            var currentDate = new Date();
            var diffInTime = currentDate - input;
            if (diffInTime / 1000 / 60 <= 60) {
                return (diffInTime / 1000 / 60 ) + "mins";
            } else if (diffInTime / 1000 / 60 / 60 <= 24) {
                return (diffInTime / 1000 / 60 / 60 ) + "hours";
            } else {
                return input.toDateString();
            }
        };
    }
);

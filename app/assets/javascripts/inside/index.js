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
                for (var j = 0; j < response.data[i].topTweets.length; j++) {
                    response.data[i].topTweets[j].entities = angular.fromJson(response.data[i].topTweets[j].entities);
                };
                // inject coverBg for background image
                if (response.data[i].coverTweet.entities.media) {
                    response.data[i].coverBg = {
                        backgroundImage: "url(\""+response.data[i].coverTweet.entities.media[0].media_url+":small\")"
                    };
                } else {
                    response.data[i].coverBg = {
                        backgroundColor: '#bdc3c7'
                    };
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

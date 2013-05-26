// Add {{=  }} style interpolate to underscore.js
_.templateSettings = {
    interpolate: /\{\{\=(.+?)\}\}/g,
    evaluate: /\{\{(.+?)\}\}/g,
    escape: /\{\{\-(.+?)\}\}/g
};


function getURLParams() {
    "use strict";
    if (location.search !== "") {
        var params = location.search.substr(1).split('&'),
            params_hash = {};
        for (var i = 0; i < params.length; i++) {
            var pair = params[i].split('=');
            params_hash[pair[0]] = pair[1];
        }
        return params_hash;
    }
}

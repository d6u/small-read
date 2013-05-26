//= require modernizr-2.6.2.min.js
//= require jquery-2.0.0.min.js
//= require jquery_ujs
//= require jquery-ui-1.10.3.custom.min.js
//= require underscore.min.js
//= require json2.js
//= require backbone.min.js
//= require jquery.simplemodal.1.4.4.min.js
//= require custom-functions.js
//= require modules/feedback_modal.js


$(document).ready(function() {

// Navbar View
// ===========
var NavbarView = Backbone.View.extend({
    el: '.navbar',
    events: {
        'click .refresh-feeds': 'fetchFoldersAndFeeds'
    },
    fetchFoldersAndFeeds: function(event) {
        event.preventDefault();
        if (!$(event.currentTarget).children('.icon-refresh').hasClass('icon-spin')) {
            var url = $(event.currentTarget).attr('href');
            $(event.currentTarget).children('.icon-refresh').addClass('icon-spin');
            $.get(url, function(data, textStatus, jqXHR) {
                _.each(folders.models, function(folder, index, models) {
                    folder.feeds.fetch();
                });
                $(event.currentTarget).children('.icon-refresh').removeClass('icon-spin');
            });
        }
    }
});

var navbar_view = new NavbarView();

// Folder
// ======
var FolderView = Backbone.View.extend({
    tagName: 'div',
    className: 'folder list-container-item',
    template: _.template($('#folder-template').html()),
    events: {
        'click .folder-face': 'loadTweets'
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        return this;
    },
    // events callbacks
    loadTweets: function(event) {
        event.preventDefault();
        tweets.loadTweets(this.model);
    }
});

var Folder = Backbone.Model.extend({
    initialize: function(attributes, options) {
        if (!options.view) {
            this.view = new FolderView({model: this});
        } else {
            this.view = new FolderView({el: options.view, model: this});
        }
        this.feeds = options.feeds;
        console.log(this);
    }
});

var Folders = Backbone.Collection.extend({
    model: Folder,
    initialize: function(models, options){
        this.view = options.view;
    }
});

// Feed
// ====
var FeedView = Backbone.View.extend({
    tagName: 'div',
    className: 'feed list-container-item',
    template: _.template($('#feed-template').html()),
    events: {
        'click .item-face': 'loadTweets'
    },
    initialize: function(options){
        var that = this;
        this.listenTo(this.model, 'change:folder_id', function(model, value, options) {
            that.el.dataset.folder_id = value;
        });
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        return this;
    },
    // events callbacks
    loadTweets: function(event) {
        event.preventDefault();
        tweets.loadTweets(this.model);
    }
});

var Feed = Backbone.Model.extend({
    urlRoot: "/feeds",
    initialize: function(attributes, options) {
        if (!options.view) {
            this.view = new FeedView({model: this});
        } else {
            this.view = new FeedView({el: options.view, model: this});
        }
        console.log(this);
    }
});

var Feeds = Backbone.Collection.extend({
    model: Feed
});

// Main Views
// ==========
var FeedsContent = Backbone.View.extend({
    el: '.feeds'
});

// Initialization of App
// =====================
var folder_models = [];

$('.folder').each(function(index, folder_element) {
    var $folder_ele = $(folder_element);

    // Feed
    var feed_models = [];

    $folder_ele.find('.feed').each(function(index, feed_element) {
        // var $feed_ele = $(feed_element);
        feed_models.push(new Feed(
            feed_element.dataset,
            { view: feed_element }
        ));
    });

    // Folder
    folder_models.push(new Folder(
        folder_element.dataset,
        {
            view: folder_element,
            feeds: new Feeds(feed_models)
        }
    ));
});

var folders = new Folders(
    folder_models,
    { view: new FeedsContent() }
);

folders.view.$('.folder-feeds-list').sortable({
    axis: "y",
    connectWith: ".folder-feeds-list",
    placeholder: "feed-sortable-placeholder",
    scrollSpeed: 40,
    zIndex: 100,
    update: function(event, ui) {
        if (ui.sender) {
            var sender_id   = ui.sender.closest('.folder')[0].dataset.id,
                receiver_id = ui.item.closest('.folder')[0].dataset.id,
                feed_id     = ui.item[0].dataset.id;
            var sender      = folders.where({id: sender_id})[0],
                receiver    = folders.where({id: receiver_id})[0],
                feed        = sender.feeds.where({id: feed_id})[0];
            feed.save({folder_id: receiver_id});
            sender.feeds.remove(feed, {silent: true});
            receiver.feeds.add(feed, {silent: true});
        }
    }
});

// END of Document Ready
});

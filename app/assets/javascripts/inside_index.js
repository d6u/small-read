//= require modernizr-2.6.2.min.js
//= require jquery-2.0.0.min.js
//= require jquery_ujs
//= require jquery-ui-1.10.3.custom.min.js
//= require underscore.min.js
//= require json2.js
//= require backbone.min.js
//= require jquery.simplemodal.1.4.4.min.js
//= require bootstrap.tooltips.min.js
//= require jquery.icheck.min.js
//= require custom-functions.js
//= require modules/feedback_modal.js


var needle;
$(document).ready(function() {


// Navbar View
// ===========
var NavbarView = Backbone.View.extend({
    el: '.navbar-vertical',
    initialize: function() {
        this.fetchTwitterAPILimits();
        $('.gravatar-image-element').tooltip({
            title: 'Change your profile image at Gravatar.com',
            placement: 'right',
            container: 'body'
        });
        $('#twitter_api_counts').tooltip({
            title: '<p class="lead">What is this?</p><p>Twitter limits how many times each user can fetch contents from its sever within 15 minutes. The number indicates remaining counts untill next reset time (within 15 minutes).</p>',
            html: true,
            placement: 'right',
            container: 'body'
        });
    },
    fetchTwitterAPILimits: function() {
        var that = this;
        $.get('/bg/twitter_api_counts', function(response){
            that.$('#twitter_api_counts').html(response.limits);
            if (response.limits <= 3) {
                that.$('#twitter_api_counts').removeClass('badge-info').addClass('badge-important');
            } else {
                that.$('#twitter_api_counts').removeClass('badge-important').addClass('badge-info');
            }
        });
    }
});

var navbar_view = new NavbarView();

// Tweets
// ======
var TweetView = Backbone.View.extend({
    tagName: 'div',
    className: 'tweet clearfix',
    template: _.template($('#tweet-template').html()),
    events: {
        'click': 'toggleReadWhenClick'
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        if (this.model.get('read')) {
            this.$el.addClass('read');
        }
        return this;
    },
    toggleReadWhenClick: function(event) {
        if (this.model.get('read') !== true) {
            this.model.toggleRead();
        }
    }
});

var Tweet = Backbone.Model.extend({
    urlRoot: '/tweets/',
    initialize: function(attributes, options) {
        this.entities = JSON.parse(attributes.entities);
        if (this.entities.media) {
            this.set('entities_image', this.entities.media[0].media_url);
        } else {
            this.set('entities_image', null);
        }
        this.view = new TweetView({ model: this });
    },
    toggleRead: function(save) {
        save = typeof save !== 'undefined' ? save : true;
        var that = this;
        this.view.$el.addClass("read");
        this.set('read', true);
        if (save === true) {
            var unread_count = tweets.current_source.get('unread_count');
            tweets.current_source.set('unread_count', unread_count - 1);
            if (!tweets.current_source.has('folder_id')) {
                // folder
                var source_feed = tweets.current_source.feeds.where({id: this.get('feed_id').toString()})[0];
                var feed_unread_count = source_feed.get('unread_count');
                source_feed.set('unread_count', feed_unread_count - 1);
            } else {
                // feed
                var parent_folder_id = tweets.current_source.get('folder_id');
                var parent_folder = folders.where({id: parent_folder_id})[0];
                var parent_folder_unread_count = parent_folder.get('unread_count');
                parent_folder.set('unread_count', parent_folder_unread_count - 1);
            }
            this.save(
                {read: true},
                {
                    success: function(model, response, options) {},
                    error: function(model, xhr, options) {}
                }
            );
        }
    }
});

var TweetsContent = Backbone.View.extend({
    el: '.tweets',
    events: {
        // 'scroll' event won't bubble up, attached in initialize()
        'click #mark_all_read': 'markAllRead'
    },
    initialize: function() {
        // attach 'scroll' event
        var that = this;
        this.$('.tweets-list').on('scroll', function() {
            if (!that.collection.isEmpty()) {
                that.markRead();
                that.loadMoreTweets();
            }
        });
        this.$('#display_only_unread').iCheck({
            checkboxClass: 'icheckbox_square-blue display-only-unread-icheck',
            increaseArea: '20%'
        });
    },
    markRead: function() {
        this.collection.each(function(tweet) {
            if (!tweet.get('read') && (tweet.view.$el.position().top + 20) < 0) {
                tweet.toggleRead();
            }
        });
    },
    markAllRead: function(event) {
        event.preventDefault();
        var that = this;
        if (!this.collection.isEmpty() && confirm('Mark everything READ?')) {
            if (this.collection.current_source.has('folder_id')) {
                // this is a feed
                $.post(
                    '/mark_all_read',
                    {feed_id: this.collection.current_source.get('id')},
                    function(data, textStatus, jqXHR) {
                        that.collection.each(function(tweet) {
                            tweet.toggleRead(false);
                        });
                        var feed_previous_unread_count = that.collection.current_source.get('unread_count');
                        that.collection.current_source.set('unread_count', 0);
                        var current_folder = that.collection.current_source.collection.folder;
                        var current_folder_unread_count = current_folder.get('unread_count');
                        current_folder.set('unread_count', current_folder_unread_count - feed_previous_unread_count);
                    }
                );
            } else {
                // this is a folder
                $.post(
                    '/mark_all_read',
                    {folder_id: this.collection.current_source.get('id')},
                    function(data, textStatus, jqXHR) {
                        that.collection.each(function(tweet) {
                            tweet.toggleRead(false);
                        });
                        that.collection.current_source.set('unread_count', 0);
                        that.collection.current_source.feeds.each(function(feed){
                            feed.set('unread_count', 0);
                        });
                    }
                );
            }
        }
    },
    loadMoreTweets: function() {
        if (!this.collection.reachesEnd && !this.collection.loadingMoreTweets) {
            var containerHeight = this.collection.models[this.collection.models.length - 1].view.$el.parent().height();
            var lastTweetViewDistanceToTop = this.collection.models[this.collection.models.length - 1].view.$el.position().top;
            if (containerHeight + 50 >= lastTweetViewDistanceToTop && !this.collection.loadingMoreTweets) {
                this.collection.loadingMoreTweets = true;
                this.collection.loadMoreTweets();
            }
        }
    }
});

var Tweets = Backbone.Collection.extend({
    model: Tweet,
    initialize: function(models, options) {
        var that = this;
        this.loadingMoreTweets = false;
        this.reachesEnd = null;
        this.loadingBehavior = 'unreadOnly';
        this.view = options.view;
        this.view.collection = this;
        // empty current set of Tweets
        this.on('reset', function(that, options) {
            _.each(options.previousModels, function(model, index, models) {
                model.view.remove();
            }, this);
            that.reachesEnd = null;
        }, this);
        // add new Tweets
        this.on('add', function(tweet, tweets, options) {
            this.view.$('.tweets-list').append(tweet.view.render().el);
        }, this);
        this.view.$('#display_only_unread')
        .on('ifChecked', function(event) {
            that.loadingBehavior = 'unreadOnly';
            if (that.current_source) {
                that.reloadTweets();
            }
        })
        .on('ifUnchecked', function(event) {
            that.loadingBehavior = 'all';
            if (that.current_source) {
                that.reloadTweets();
            }
        });
    },
    loadTweets: function(source) {
        this.view.$('.tweets-list').scrollTop(0);
        this.reset();
        this.view.$('.tweets-list').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>');
        this.current_source = source;
        if (this.loadingBehavior === 'unreadOnly') {
            this.urlRoot = this.current_source.has('folder_id') ? ("/feeds/"+this.current_source.id + "/tweets") : ("/folders/"+this.current_source.id + "/tweets");
        } else if (this.loadingBehavior === 'all') {
            this.urlRoot = this.current_source.has('folder_id') ? ("/feeds/"+this.current_source.id + "/tweets?all=true") : ("/folders/"+this.current_source.id + "/tweets?all=true");
        }
        this.url = this.urlRoot;
        this.fetch({
            success: function(that, response) {
                if (response.length < 20) {
                    that.reachesEnd = true;
                }
            },
            error: function(collection, response) {}
        });
    },
    reloadTweets: function() {
        this.view.$('.tweets-list').scrollTop(0);
        this.reset();
        this.view.$('.tweets-list').html('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>');
        if (this.loadingBehavior === 'unreadOnly') {
            this.urlRoot = this.current_source.has('folder_id') ? ("/feeds/"+this.current_source.id + "/tweets") : ("/folders/"+this.current_source.id + "/tweets");
        } else if (this.loadingBehavior === 'all') {
            this.urlRoot = this.current_source.has('folder_id') ? ("/feeds/"+this.current_source.id + "/tweets?all=true") : ("/folders/"+this.current_source.id + "/tweets?all=true");
        }
        this.url = this.urlRoot;
        this.fetch({
            success: function(that, response) {
                if (response.length < 20) {
                    that.reachesEnd = true;
                }
            },
            error: function(collection, response) {}
        });
    },
    loadMoreTweets: function() {
        this.view.$('.tweets-list').append('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>');
        var max_id = this.last().get('id') - 1;
        this.url = (this.loadingBehavior === 'unreadOnly') ? (this.urlRoot + "?max_id=" + max_id) : (this.urlRoot + "&max_id=" + max_id);
        this.fetch({
            remove: false,
            success: function(that, response) {
                if (response.length < 20) {
                    that.reachesEnd = true;
                }
            },
            error: function(collection, response) {}
        });
    },
    parse: function(response) {
        if (!this.loadingMoreTweets) {
            this.view.$('.tweets-list').empty();
        } else {
            this.view.$('.progress.progress-striped.active').remove();
            this.loadingMoreTweets = false;
        }
        return response;
    }
});

// Folder
// ======
var FolderView = Backbone.View.extend({
    tagName: 'div',
    className: 'folder list-container-item',
    template: _.template($('#folder-template').html()),
    events: {
        'click .folder-face': 'loadTweets',
        'click .folder-option-expand': 'expandFolderList'
    },
    initialize: function(options) {
        var that = this;
        this.listenTo(this.model, 'change:unread_count', function(model, value, options) {
            that.el.dataset.unread_count = value;
            that.$('.folder-face .unread-count').html(value);
        });
    },
    render: function() {
        this.$el.append(this.template(this.model.attributes));
        return this;
    },
    expandFolderList: function(event) {
        event.preventDefault();
        var $feeds_list = this.$('.folder-feeds-list');
        if ( $feeds_list.height() === 0 ) {
            this.$('.folder-feeds-list').css({height: 'auto'});
        } else {
            this.$('.folder-feeds-list').css({height: 0});
        }
    },
    // events callbacks
    loadTweets: function(event) {
        event.preventDefault();
        tweets.loadTweets(this.model);
    }
});

var Folder = Backbone.Model.extend({
    urlRoot: '/folders',
    initialize: function(attributes, options) {
        if (!options.view) {
            this.view = new FolderView({model: this});
        } else {
            this.view = new FolderView({el: options.view, model: this});
        }
        this.feeds = options.feeds;
        this.feeds.folder = this;
    }
});

var Folders = Backbone.Collection.extend({
    model: Folder,
    initialize: function(models, options){
        this.view = options.view;
        this.view.collection = this;
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
        this.listenTo(this.model, 'change:unread_count', function(model, value, options) {
            that.el.dataset.unread_count = value;
            that.$('.unread-count').html(value);
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
            this.view = new FeedView({model: this, attributes: this.attributes});
        } else {
            this.view = new FeedView({el: options.view, model: this});
        }
    }
});

var Feeds = Backbone.Collection.extend({
    model: Feed,
    initialize: function(models, options) {
        this.url = '/folders/'+options.folder_id+'/feeds';
        this.on('add', function(feed, feeds, options) {
            this.folder.view.$('.folder-feeds-list').append(feed.view.render().el);
        }, this);
        this.on('remove', function(feed, feeds, options) {
            feed.view.remove();
        }, this);
    }
});

// Main Views
// ==========
var FeedsContent = Backbone.View.extend({
    el: '.feeds',
    events: {
        'click #refresh': 'fetchFoldersAndFeeds'
    },
    fetchFoldersAndFeeds: function(event) {
        event.preventDefault();
        if (!$(event.currentTarget).children('.icon-refresh').hasClass('icon-spin')) {
            var url = $(event.currentTarget).attr('href');
            $(event.currentTarget).children('.icon-refresh').addClass('icon-spin');
            $.get(url, function(data, textStatus, jqXHR) {
                _.each(folders.models, function(folder, index, models) {
                    folder.feeds.fetch({
                        success: function(collection, response, options) {
                            folder.fetch();
                        }
                    });
                });
                $(event.currentTarget).children('.icon-refresh').removeClass('icon-spin');
                navbar_view.fetchTwitterAPILimits();
            });
        }
    }
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
            feeds: new Feeds(
                feed_models,
                {folder_id: folder_element.dataset.id}
            )
        }
    ));
});

// Init Folders and Tweets
var folders = new Folders(
    folder_models,
    { view: new FeedsContent() }
);
var tweets = new Tweets(
    [],
    { view: new TweetsContent() }
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

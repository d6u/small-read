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


// Manage Folders view
// -------------------
var ManageFoldersView = Backbone.View.extend({
    el: '.folder-management',
    events: {
        'click #create_new_folder_button': 'addNewFolder'
    },
    initialize: function(options) {
    },
    addNewFolder: function(event) {
        event.preventDefault();
        if (this.$('#new_folder_name').val() === "") {
            this.showCreateFolderWarning();
        } else {
            this.hideCreateFolderWarning();
            this.collection.create(
                {
                    name: this.$('#new_folder_name').val(),
                    position: 0
                },
                { wait: true }
            );
        }
    },
    showCreateFolderWarning: function() {
        this.$('#create_folder_alert').fadeIn(200);
    },
    hideCreateFolderWarning: function() {
        this.$('#create_folder_alert').fadeOut(200);
    }
});

// FolderOnlyView View
// -------------------
var FolderOnlyView = Backbone.View.extend({
    tagName: 'div',
    className: 'folder-list-item alert alert-info',
    template: _.template($('#folder-management-template').html()),
    events: {
        'click .rename-folder': 'renameFolder',
        'dblclick .folder-list-item-name': 'renameFolder',
        'click .submit-folder-rename': 'finishRenaming',
        'click .delete-folder': 'deleteFolder'
    },
    initialize: function(options) {
        console.log(this.model);
        var that = this;
        this.listenTo(this.model, 'change:name', function(model, value, options) {
            that.$('.folder-list-item-name').html(model.get('name'));
        });
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    renameFolder: function(event) {
        this.$('.folder-list-item-name').hide();
        this.$('.folder-list-item-rename').show();
    },
    finishRenaming: function(event) {
        var new_name = this.$('.folder-list-item-rename input').val();
        if ( new_name !== "" && new_name !== this.model.name ) {
            this.model.save({name: new_name});
        }
        this.$('.folder-list-item-rename').hide();
        this.$('.folder-list-item-name').show();
    },
    deleteFolder: function(event) {

    }
});

// FolderOnly Model
// ----------------
var FolderOnly = Backbone.Model.extend({
    initialize: function(attributes, options) {
        if (options.view) {
            this.view = new FolderOnlyView({
                el: options.view,
                model: this
            });
        } else {
            this.view = new FolderOnlyView({
                model: this
            });
        }
    }
});

// FolderOnlyCollection
// --------------------
var FolderOnlyCollection = Backbone.Collection.extend({
    model: FolderOnly,
    url: '/folders',
    initialize: function(models, options) {
        this.view = options.view;
        this.view.collection = this;
        this.on('add', function(model, collection, options) {
            this.view.$('.folder-list').append(model.view.render().el);
        }, this);
    }
});



// Initialization
// ==============

var folder_list_items = [];
$('.folder-list-item').each(function(index, ele) {
    folder_list_items.push(new FolderOnly(
        ele.dataset,
        { view: ele }
    ));
});

var folder_only_collection = new FolderOnlyCollection(
    folder_list_items,
    { view: new ManageFoldersView() }
);




$('.folder-feeds-container').sortable({
    connectWith: ".folder-feeds-container",
    placeholder: "sortable-placeholder",
    scrollSpeed: 40,
    zIndex: 100,
    update: function(event, ui) {
        if (ui.sender) {
            var sender_id = Number(ui.sender.closest('.folder-container').attr('data-id')),
                receiver_id = Number(ui.item.closest('.folder-container').attr('data-id')),
                item_id = Number(ui.item.attr('data-id'));
            $.post('/manage_folders', {
                source_folder_id: sender_id,
                dest_folder_id:   receiver_id,
                feed_id:          item_id
            });
        }
    }
}).disableSelection();

// END of Document Ready
});
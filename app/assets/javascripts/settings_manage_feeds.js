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

// Feeds Management
// ----------------
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
            $.post('/bg/manage_feeds', {
                source_folder_id: sender_id,
                dest_folder_id:   receiver_id,
                feed_id:          item_id
            });
        }
    }
}).disableSelection();

// END of Document Ready
});
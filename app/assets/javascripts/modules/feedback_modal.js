$(document).ready(function($) {

// Feedback
// ========
$('a[href="#feedbackModal"]').on('click', function(event){
    event.preventDefault();
    $("#feedbackModal").modal({
        overlayClose: true,
        escClose: true,
        closeHTML: '',
        closeClass: 'feedback-modal-cancel',
        onShow: function(dialog) {
            $(dialog.container).find('#page_name').val(location.href);
        }
    });
});


});

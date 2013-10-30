// Items Page
$('.btn-danger').click(function(eventObject) {
  var id = $(eventObject.target).data('id');
  $.ajax({
    url: '/items/' + id,
    type: 'DELETE',
    success: function() {
      $(eventObject.target).closest('tr').remove();
    }
  });
});

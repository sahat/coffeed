/**
 * Items page
 */
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

/**
 * Place A New Order page
 */
$('#placeOrder').click(function(e) {
  var orderType = $(e.target).data('order-type');
  var location = $('input:radio[name=location]:checked').val();
  var items = [];

  $('.quantity').each(function(index, input) {
    if ($(input).val() != 0) {
      items.push({
        name: $(input).attr('name'),
        quantity: $(input).val()
      });
    }
  });

  $.ajax({
    type: 'POST',
    url: '/orders',
    data: { orderType: orderType, location: location, items: items },
    success: function(data) {
      $('#placeOrder').text('Done!').attr('disabled', true);
      $('#viewPlacedOrder').show().attr('href', '/orders');
      alertify.success(data);
    },
    error: function(jqXHR) {
      alertify.error(jqXHR.responseText);
    }
  });


});
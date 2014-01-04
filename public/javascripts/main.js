/**
 * Items page
 */
$('.delete').click(function(e) {
  e.preventDefault();

  var id = $(e.target).data('id');
  var name = $(e.target).data('name');
  var url = (name === 'location') ? '/admin/locations/' + id : '/admin/items/' + id;

  $.ajax({
    url: url,
    type: 'DELETE',
    success: function() {
      $(e.target).closest('tr').remove();
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
      $('#viewPlacedOrder').show().attr('href', '/orders?type=' + orderType);
      alertify.success(data);
    },
    error: function(jqXHR) {
      alertify.error(jqXHR.responseText);
    }
  });
});

$(function() {
  $.fn.editable.defaults.ajaxOptions = { type: 'PUT' };
  $('.editable').editable();
});
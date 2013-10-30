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
 * New Order page
 */
$('.btn-success').click(function(eventObject) {
  var items = [];
  var orderType = $(eventObject.target).data('order-type')
  var $quantityFields = $('.quantity');

  $.each($quantityFields, function(index, field) {
    items.push({
      name: $(field).data('name'),
      quantity: $(field).val()
    });
  });

  var postData = {
    orderType: orderType,
    items: items,
    location: $('button.active').text()
  };

  $.post('/orders', postData, function() {
    location.href = '/';
  });
});
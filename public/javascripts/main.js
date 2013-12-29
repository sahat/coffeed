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
$('.btn-success').click(function(e) {
  var items = [];
  var orderType = $(e.target).data('order-type')
  var $qty = $('.quantity');

  $.each($qty, function(index, input) {
    items.push({
      name: $(input).data('name'),
      quantity: $(input).val()
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
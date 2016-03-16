$('#variants_table_body').on('scroll', function () { 
     $('#variants_table_head').scrollLeft($(this).scrollLeft());
});
$('.variants-table-search-field button').each(function () {
    var button = $(this); 
    var div = button.closest('div');
    var input = div.find('input'); 

    
    button.on('click', function(e) {
     div.addClass('open');
     input.focus();
    });
    input.focusout(function(e) {
      div.removeClass('open');
    });
});

$('#variants_table_body td').each(function () {
    var td = $(this); 
    var tr = td.closest('tr');
    
    td.on('click', function(e) {
    tr.toggleClass('active');
  });
});

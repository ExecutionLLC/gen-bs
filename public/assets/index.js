$(function () {
/*
    $('.toggle').click(function () {
        $('.nav-list').toggleClass('active');
    });
*/

    $(document).on('click', '#navbar a', function (e) {
        var href = $(this).attr('href');
        if (href === '#' || /^http.*/.test(href)) {
            return;
        }
  
        e.preventDefault();
        //$('.nav-list').removeClass('active');
        location.hash = href;
        $('iframe').attr('src', href);
       
    });

    var href = location.hash.substring(1) || 'gen-en.html';
    $('iframe').attr('src', href);
    //initNavigation(href);

/*
    $(window).on('blur',function() {
        $('.dropdown-toggle').parent().removeClass('open');
    });
*/
 


/*
      $('#samplesSelect').select2({
            placeholder: "Find sample",
            allowClear: true,
            //minimumResultsForSearch: Infinity
      });
*/
  

    $('#btnLogin').on('click', function (e) {
      $('#guest').addClass("hidden");
      $('#user').removeClass("hidden");
     });
      $('#btnLogout').on('click', function (e) {
      $('#user').addClass("hidden");
      $('#guest').removeClass("hidden");
     });
     

/*
    $('select').select2({
      allowClear: true,
      placeholder: "No selected",
      minimumResultsForSearch: Infinity
    });
*/
     
});

/*
function initNavigation(href) {
    var $el = $('a[href="' + href + '"]'),
        $prev, $next;

    $('.ribbon a').attr('href',
        'https://github.com/wenzhixin/bootstrap-table-examples/blob/master/' + href);

    if (!$el.length) {
        return;
    }
    $prev = $el.parent().prev('li');
    $next = $el.parent().next('li');
    $('.navigation a').hide();

    if ($prev.text()) {
        $('.navigation .previous').show()
            .attr('href', $prev.find('a').attr('href'))
            .find('span').text($prev.text());
    }
    if ($next.text()) {
        $('.navigation .next').show()
            .attr('href', $next.find('a').attr('href'))
            .find('span').text($next.text());
    }
}
*/
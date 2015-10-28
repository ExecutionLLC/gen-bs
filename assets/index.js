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

    var href = location.hash.substring(1) || 'gen-index.html';
    $('iframe').attr('src', href);
    //initNavigation(href);

/*
    $(window).on('blur',function() {
        $('.dropdown-toggle').parent().removeClass('open');
    });
*/
 

 var countries = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  // url points to a json file that contains an array of country names, see
  // https://github.com/twitter/typeahead.js/blob/gh-pages/data/countries.json
  prefetch: '../json/samples1.json'
});

// passing in `null` for the `options` arguments will result in the default
// options being used
$('#prefetch .typeahead').typeahead(null, {
  name: 'countries',
  source: countries,
  
});
/*
      $('#samplesSelect').select2({
            placeholder: "Find sample",
            allowClear: true,
            //minimumResultsForSearch: Infinity
      });
*/
  

    $('#btnOpenid').on('click', function (e) {
      $('.dropdown-profile').removeClass("hidden");
      $(this).addClass("hidden");
     });
     
   
     
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
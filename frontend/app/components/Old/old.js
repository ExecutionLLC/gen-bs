
//layout// sidebar  
// media query event handler
if (matchMedia) {
	var mq = window.matchMedia("(min-width: 768px)");
	mq.addListener(WidthChange);
	WidthChange(mq);
}

// media query change
function WidthChange(mq) {

	if (mq.matches) {
		// window width is at least 768px
		$('[data-toggle="tooltip"]').tooltip({
  		trigger: "hover",
  		delay: { "show": 500, "hide": 100 }
		});
	}
	else {
		// window width is less than 768px
		$('#subnav').collapse('hide');
		$('body').addClass("subnav-closed");
		$('[data-toggle="tooltip"]').tooltip('destroy');
		$('[data-toggle="tooltip"]').tooltip({
  		trigger: "click"
		});
		
	}

}


//layout
    $('#sidebarLeft').on('hide.bs.collapse', function () {
        $('body').addClass("sidebar-left-closed");
    });
    $('#sidebarLeft').on('shown.bs.collapse', function () {
        $('body').removeClass("sidebar-left-closed");
        $('[data-toggle="tooltip"]').tooltip('destroy');
        $('[data-toggle="tooltip"]').tooltip({
  		    trigger: "click"
		    });
      });
     $('#sidebarRight').on('hide.bs.collapse', function () {
     
     $('body').addClass("sidebar-right-closed");
     $('[data-toggle="tooltip"]').tooltip('destroy');
      $('[data-toggle="tooltip"]').tooltip({
  		  trigger: "click"
		  });
     });
    $('#sidebarRight').on('shown.bs.collapse', function () {
        $('body').removeClass("sidebar-right-closed");
    });
    $('#regBtn').on('click', function (e) {
     $('#registration').removeClass('hidden') ;
     $('#signin').addClass('hidden');
    });
    $('.user-view').on('hide.bs.collapse', function () {
        $('body').removeClass("sidebar-closed");
    });
    $('.user-view').on('show.bs.collapse', function () {
        $('body').removeClass("sidebar-closed");
    });   
    $('#subnav').on('hidden.bs.collapse', function () {
      $('body').addClass("subnav-closed");
    });
    $('#subnav').on('show.bs.collapse', function () {  
      $('body').removeClass("subnav-closed");
      console.log('show.bs.collapse');
    }); 

    $('#selectColumns, #filter').on('hidden.bs.modal', function (e) {
  
      $('#analyzeBtnGroup').tooltip('destroy');
      $('#analyzeBtnGroup').tooltip({
         template: '<div class="tooltip fadeInUp" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
         trigger: 'click',
         container: 'body',
         placement: 'bottom'
      });
      $('#analyzeBtnGroup').tooltip('show'); 
      
    });


//select2        
$('.select2').select2({
  placeholder: "Not chosen",
  minimumResultsForSearch: Infinity
});
$('.selectTree').select2();

//ajax select2
 var $ajax = $(".sample-search"); 
         
 function formatRepo (repo) {
      if (repo.loading) return repo.text;

      var markup = "<div class='flex'>" +
          "<dl><dt>Name: </dt><dd>" + repo.full_name + "</dd></dl>" +
          "<dl><dt>Versia: </dt><dd>V." + repo.forks_count + "</dd></dl>" +
          "<dl><dt>Size: </dt><dd>" + repo.stargazers_count + "</dd></dl>";          

      if (repo.description) {
        markup += "<dl><dt>Description: </dt><dd>" + repo.description + "</dd></dl>";
      }

      markup += "<dl><dt>Name: </dt><dd>" + repo.watchers_count + "</dd></dl>" +
        "<dl><dt>Subject ID: </dt><dd>" + repo.forks_count +  "</dd></dl>" +
        "<dl><dt><span class='text-success'>Analyzed</span> </dt><dd>12.12.2015 23:34</dd></dl>" +
        "</div>";

      return markup;
    }
 function formatRepoSelection (repo) {
      return repo.full_name || repo.text;
    }               
 $ajax.select2({
      ajax: {
        url: "https://api.github.com/search/repositories",
        dataType: 'json',
        delay: 250,
        data: function (params) {
          return {
            q: params.term, // search term
            page: params.page
          };
        },
        processResults: function (data, params) {
          // parse the results into the format expected by Select2
          // since we are using custom formatting functions we do not need to
          // alter the remote JSON data, except to indicate that infinite
          // scrolling can be used
          params.page = params.page || 1;

          return {
            results: data.items,
            pagination: {
              more: (params.page * 30) < data.total_count
            }
          };
        },
        cache: true
      },
      escapeMarkup: function (markup) { return markup; },
      minimumInputLength: 1,
      templateResult: formatRepo,
      templateSelection: formatRepoSelection
    });
     

       
//jquery builder selects
$('#builder-basic .selectTree').each(function () {
            var button = $(this);
            button.select2().on('change', function(e) {
             
             $("#copyfilterField").collapse("show");
             $("#newfilterField").collapse("show");
          });
      });

$('#builder-basic .selectTree').select2()
  .on("change", function(e) {
     //$(".copyfilter").collapse();
     //$("#filterSelector").val(null).trigger("change");
});


  
// temp actions
$('#btnLogin').on('click', function (e) {
  $('.guest').addClass("hidden");
  $('.user').removeClass("hidden");
 });
$('#btnLogout').on('click', function (e) {
  $('user').addClass("hidden");
  $('#guest').removeClass("hidden");
});

$('#userEditBtn').on('click', function (e) {
   $('.user-view').toggleClass('hidden')
  });
$('.usrViewActBtn').on('click', function (e) {
   $('.user-view').toggleClass('hidden')
});
$('.btnSort.active').on('click', function (e) { 
   $(this).toggleClass('asc').toggleClass('desc');
});

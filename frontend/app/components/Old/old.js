
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
		// window width is at least 500px
		$('[data-toggle="tooltip"]').tooltip();
	}
	else {
		// window width is less than 500px
	}

}
    $('#sidebarLeft').on('hide.bs.collapse', function () {
        $('body').addClass("sidebar-left-closed");
    })

    $('#sidebarLeft').on('shown.bs.collapse', function () {
        $('body').removeClass("sidebar-left-closed");
    })
   $('#sidebarRight').on('hide.bs.collapse', function () {
     $('body').addClass("sidebar-right-closed");
    })

    $('#sidebarRight').on('shown.bs.collapse', function () {
        $('body').removeClass("sidebar-right-closed");
    })
    
    $('.user-view').on('hide.bs.collapse', function () {
        $('body').removeClass("sidebar-closed");
    })

    $('.user-view').on('show.bs.collapse', function () {
        $('body').removeClass("sidebar-closed");
    })    
    $('#subnav').on('hidden.bs.collapse', function () {
      $('body').addClass("subnav-closed");
    });
    $('#subnav').on('show.bs.collapse', function () {  
      $('body').removeClass("subnav-closed");
    }); 


           
$('.select2').select2({
  placeholder: "Not chosen",
  minimumResultsForSearch: Infinity
});

$('.selectTree').select2();


 var $ajax = $(".sample-select-ajax"); 
         
 function formatRepo (repo) {
      if (repo.loading) return repo.text;

      var markup = "<div class='row'>" +
        "<div class='col-sm-6'>" +
          "<span class='metadata s-name'>" + repo.full_name + "</span>" +
          "<span class='s-versia'> V. " + repo.forks_count + "</span>" +
          "<span class='s-size'>" + repo.stargazers_count + " KB</span>";
          

      if (repo.description) {
        markup += "<span class='metadata s-descr'>" + repo.description + "</span>";
      }

      markup += "</div>" +
        "<div class='col-sm-6'>" +
        "<span class='metadata s-familyID'>Family ID: <span>" + repo.watchers_count + "</span></span>" +
        "<span class='metadata s-subjectID'>Subject ID: <span>" + repo.forks_count + "</span></span>" ;
        if (repo.commits_url) {
         markup += "<span class='metadata s-analises'><i class='fa fa-check'></i> Analyzed <span> 24.09.2015 34:45</span>";
        }
         markup +="</div></div>";

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
  
   ///
         
          
    $('#btnOpenid').on('click', function (e) {
      $('.dropdown-profile').removeClass("hidden");
      $(this).addClass("hidden");
     });
     

     $('[data-toggle="tooltip"]').tooltip();
     
   
     $('.dropdown-menu-rows').find('form').click(function (e) {
      e.stopPropagation();
     });       

     /*
 $('#btnDel').click(function () {
       alert("jr");
        //$("#filterSelector").val(["eye"]).trigger("change");
      )};
*/

      $('#builder-basic .selectTree').each(function () {
                  var button = $(this);
                  button.select2().on('change', function(e) {
                   
                   $("#copyfilterField").collapse("show");
                   $("#newfilterField").collapse("show");
                });
            });

     $('#builder-basic .selectTree').select2()
        .on("change", function(e) {
           $(".copyfilter").collapse();
           //$("#filterSelector").val(null).trigger("change");
      });
    


/*
$( "#sample-search" ).keypress(function() {
 $('.sample-res').removeClass('hidden')
});
$( "#sample-search" ).focusout(function() {
 $('.sample-res').addClass('hidden')
});
*/
/*

*/
/*
$('#fav4').on('click', function () {
  alert("kj");
   $('#fav-message').removeClass("hidden");
});
*/

/*


*/


$('#dropdownSamples').on('show.bs.dropdown', function () {
 $('.sample-res').addClass('hidden')
})
   
   
$('#comment').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget) // Button that triggered the modal
  var recipient = button.data('whatever') // Extract info from data-* attributes
  // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
  // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
  var modal = $(this)
  modal.find('.modal-body textarea').val(recipient)
})
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

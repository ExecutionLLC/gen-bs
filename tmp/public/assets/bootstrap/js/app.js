//layout// sidebar  
   
    
    $('#subnav').on('hide.bs.collapse', function () {
      $('body').addClass("subnav-closed");
    });
   $('#subnav').on('shown.bs.collapse', function () {  
      $('body').removeClass("subnav-closed");
   });  
   
    $('#sidebar').on('hide.bs.collapse', function () {
        $('body').addClass("sidebar-closed");
    });

    $('#sidebar').on('shown.bs.collapse', function () {
        $('body').removeClass("sidebar-closed");
    });
 
  
    
 //bootatrap table   
  var $table = $('#table');
      selections = [];
   $(function () {
        $table.bootstrapTable({
            url: '../json/data-variants.json',
            classes: 'table table-condensed table-hover',
            height: getHeight(),
            columns: [
                {
                    field: 'star',
                    formatter: operateFormatter1
                },
                {
                    field: 'comment',
                    formatter: operateFormatter
                },
                {
                    field: 'function',
                    title: "Function",
                    filterControl: 'input'
                },
                {
                    field: 'gene',
                    title: "Gene",
                    filterControl: 'input'
                },
                {
                    field: 'chromosome',
                    title: "Chromosome",
                    filterControl: 'input'
                },
                {
                    field: 'startCoordinate',
                    title: "StartCoordinate",
                    filterControl: 'input'
                },
                {
                    field: 'endCoordinate',
                    title: 'End Coordinate',
                    filterControl: 'input'
                },
                {
                    field: 'cytogeneticBand',
                    title: 'Cytogenetic Band',
                    filterControl: 'input'
                },
                {
                    field: 'affectedAminoAcid',
                    title: 'Affected Amino Acid',
                    filterControl: 'input'
                },
                {
                    field: 'proteinChange',
                    title: 'Protein Change',
                    filterControl: 'input'
                },
                {
                    field: 'granthamScore',
                    title: 'GranthamScore',
                    filterControl: 'input'
                },
                {
                    field: 'functionalConsequence',
                    title: 'Functional Consequence',
                    filterControl: 'input'
                },
                {
                    field: 'transcript',
                    title: 'Transcript',
                    filterControl: 'input'
                },
                {
                    field: 'nucleotideChange',
                    title: 'Nucleotide Change',
                    filterControl: 'input'
                }
              ]
          });  
        /*
setTimeout(function () {
            $table.bootstrapTable('resetView');
        }, 200); 
*/      
		    $table.on('all.bs.table', function (e, row, $element) {
             //$(".fht-cell").collapse("hide"); 
              
            /*
$('.filterControl select').select2({
            placeholder: "Not chosen"
             });
*/
            $('[data-index="1"] .variant').popover();
            $('[data-index="4"] .variant').popover();
            $('[data-index="7"] .variant').popover();
            $('[data-index="8"] .variant').popover();
            $('[data-index="2"] .fav').addClass("active");
            $('[data-index="3"] .fav').addClass("active");
            $('[data-index="4"] .fav').addClass("active");
            
            $('.fav').each(function () {
                  var button = $(this);
                  button.on('click', function() {
                   $('#fav-message').removeClass("hidden");
                });
            });
            
          });
		    $table.on('all.bs.table', function (e, name, args) {
            console.log(name, args);
        });
		    $(window).resize(function () {
            $table.bootstrapTable('resetView', {
                height: getHeight()
            });
        });
        });   
/*
function getIdSelections() {
    return $.map($table.bootstrapTable('getSelections'), function (row) {
        return row.id
    });
}

function responseHandler(res) {
    $.each(res.rows, function (i, row) {
        row.state = $.inArray(row.id, selections) !== -1;
    });
    return res;
}
*/
  
 function operateFormatter(value, row, index) {
  return [
      '<div class="btn-group" data-toggle="modal" data-target="#comment" data-whatever="Text of comment to this variant"><a type="button" class="btn btn-link variant" data-toggle="popover" data-placement="right" data-container="body" data-trigger="hover" data-content="Text of comment to this variant">',
      '<i class="fa fa-comment-o"></i>',
      '</a></div>'
  ].join('');
}
 function operateFormatter1(value, row, index) {
  return [
      '<div class="btn-group"><a type="button" id="fav' + index + '" class="btn btn-link fav" data-toggle="button">',
      '<i class="fa fa-star-o"></i>',
      '</a></div>'
  ].join('');
}
/*
 function totalTextFormatter(data) {
    return 'Total';
}

function totalNameFormatter(data) {
    return data.length;
}

function totalPriceFormatter(data) {
    var total = 0;
    $.each(data, function (i, row) {
        total += +(row.price.substring(1));
    });
    return '$' + total;
}
*/

 function getHeight() {
  return $(window).height() - $('#mainnav').outerHeight(true);
  }
          
           
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
          "<div class='metadata s-name'>" + repo.full_name + "</div>";
          

      if (repo.description) {
        markup += "<div class='metadata s-descr'>" + repo.description + "</div>";
      }

      markup += "<div class='s-versia'>V. " + repo.forks_count + "</div>" +
        "<div class='s-size'>" + repo.stargazers_count + " KB</div>" +
        "</div>" +
        "<div class='col-sm-6'>" +
        "<div class='metadata s-familyID'>Family ID:" + repo.watchers_count + " </div>" +
        "<div class='metadata s-subjectIDD'>Subject ID:" + repo.forks_count + " </div>" +
         "<div class='metadata s-date'>Annotated on:" + repo.created_at + " </div>" +
        "</div></div>";

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

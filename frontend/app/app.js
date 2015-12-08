
var $ = require('jquery');
window.jQuery = $;
window.$ = $;

require('./assets/css/bootstrap/less/bootstrap.less');
require('./assets/css/bootstrap/js/bootstrap.js');
require('./assets/css/font-awesome-4.4.0/css/font-awesome.min.css');
require('./assets/vendor/select2-4.0.1-rc.1/dist/css/select2.min.css');
require('../node_modules/bootstrap-table/src/bootstrap-table.css');
require('./assets/vendor/jQuery-QueryBuilder-master/dist/css/query-builder.default.min.css');


require('../node_modules/bootstrap-table/dist/bootstrap-table.js');
require('../node_modules/bootstrap-table/dist/extensions/export/bootstrap-table-export.js');
require('../node_modules/bootstrap-table/dist/extensions/filter/bootstrap-table-filter.js');
require('../node_modules/bootstrap-table/dist/extensions/filter-control/bootstrap-table-filter-control.js');
require('../node_modules/bootstrap-table/dist/extensions/multiple-sort/bootstrap-table-multiple-sort.js');
require('./assets/vendor/select2-4.0.1-rc.1/dist/js/select2.full.min.js');
//require('bootstrap-table');
require('./assets/css/index.css');

var $table = $('#table');

console.log('hello from app.js');

//$(function () {
//  var bs = $table.bootstrapTable({});
//  console.log('table', bs);
//});

//layout// sidebar  
    $('#sidebar').on('hide.bs.collapse', function () {
        $('body').addClass("sidebar-closed");
    })

    $('#sidebar').on('shown.bs.collapse', function () {
        $('body').removeClass("sidebar-closed");
    })
    $('.user-view').on('hide.bs.collapse', function () {
        $('body').removeClass("sidebar-closed");
    })

    $('.user-view').on('show.bs.collapse', function () {
        $('body').removeClass("sidebar-closed");
    })    
    $('#subnav').on('hide.bs.collapse', function () {
      $('body').addClass("subnav-closed");
    });
    $('#subnav').on('show.bs.collapse', function () {  
      $('body').removeClass("subnav-closed");
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
                    field: 'state',
                    checkbox: true
                },
                {
                    field: 'comment',
                    title: "Comment",
                    formatter: operateFormatter2,
                    filterControl: 'input'
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
 function operateFormatter2(value, row, index) {
  return [
      '<input type="text" class="form-control elipsis" value="' + value + '">'
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


import '../../../node_modules/bootstrap-table/dist/bootstrap-table.js';
import '../../../node_modules/bootstrap-table/dist/extensions/export/bootstrap-table-export.js';
import '../../../node_modules/bootstrap-table/dist/extensions/filter/bootstrap-table-filter.js';
import '../../../node_modules/bootstrap-table/dist/extensions/filter-control/bootstrap-table-filter-control.js';
import '../../../node_modules/bootstrap-table/dist/extensions/multiple-sort/bootstrap-table-multiple-sort.js';

import tableProps from './Columns';

 //bootatrap table   
var $table = $('#table');
var selections = [];

  


   $(function () {

        $table.bootstrapTable(tableProps);  
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
		    $table.on('all.bs.table', (e, name, args) => { console.log(name, args) });
            
        
		    $(window).resize(function () {
            $table.bootstrapTable('resetView', {
                height: getHeight()
            });
        });
        });   

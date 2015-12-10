var json = require('../../../json/data-variants.json');
import 'datatables.net-bs';
import 'datatables.net-bs/css/dataTables.bootstrap.css';
import 'datatables.net-responsive';
import 'datatables.net-responsive-bs/css/responsive.bootstrap.css';


//datatables.net Samples table   
const $table = $('#table');

const dtConfig = {
  "paging": false,
  "responsive": true,
  "scrollX": true,
  "ajax": {
    "url": json,
    "dataSrc": "",
  },
  "columns": [
    { "data": "function" },
    { "data": "gene" },
    { "data": "chromosome" },
    { "data": "endCoordinate" },
    { "data": "cytogeneticBand" },
    { "data": "startCoordinate" },
    { "data": "affectedAminoAcid" },
    { "data": "proteinChange" },
    { "data": "granthamScore" },
    { "data": "functionalConsequence" },
    { "data": "transcript" },
    { "data": "nucleotideChange" },
    { "data": "comment" }
  ]
};


$( () => { $('#table').DataTable( dtConfig ); } );



import 'datatables.net-bs';
import 'datatables.net-bs/css/dataTables.bootstrap.css';
import 'datatables.net-responsive';
import 'datatables.net-responsive-bs/css/responsive.bootstrap.css';


//datatables.net Samples table   
const $table = $('#table');

const dtConfig = {
  responsive: true,
  "scrollX": true,
  "ajax": {
    "url": '../../../json/data-variants.json',
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


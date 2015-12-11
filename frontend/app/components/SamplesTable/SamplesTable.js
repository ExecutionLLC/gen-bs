var json = require('../../../json/data-variants.json');
import 'datatables.net-bs';
import 'datatables.net-bs/css/dataTables.bootstrap.css';
import 'datatables.net-responsive';
import 'datatables.net-responsive-bs/css/responsive.bootstrap.css';
import 'datatables.net-scroller';
import 'datatables.net-scroller-bs/css/scroller.bootstrap.css';


//datatables.net Samples table   
const $table = $('#table');

const dtConfig = {
  paging: true,
  responsive: true,
  scrollX: false,
  scrollY: true,
  scrollY: 400,
  scrollCollapse: true,
  deferRender:    true,
  scroller:       true,
  ajax: {
    url: json,
    dataSrc: "",
  },
  "columns": [
    { "data": "comment", "title": "Comment", "visible": true},
    { "data": "function", "title": "Function", "visible": true },
    { "data": "gene", "title": "Gene", "visible": true },
    { "data": "chromosome", "title": "Chromosome", "visible": true },
    { "data": "endCoordinate", "title": "EndCoordinate", "visible": true },
    { "data": "cytogeneticBand", "title": "CytogeneticBand", "visible": true },
    { "data": "startCoordinate", "title": "StartCoordinate", "visible": true },
    { "data": "affectedAminoAcid", "title": "AffectedAminoAcid", "visible": true },
    { "data": "proteinChange", "title": "ProteinChange", "visible": true },
    { "data": "granthamScore", "title": "GranthamScore", "visible": false },
    { "data": "functionalConsequence", "title": "FunctionalConsequence", "visible": false },
    { "data": "transcript", "title": "Transcript", "visible": false },
    { "data": "nucleotideChange", "title": "NucleotideChange", "visible": false }
  ]
};


$( () => { $('#table').DataTable( dtConfig ); } );


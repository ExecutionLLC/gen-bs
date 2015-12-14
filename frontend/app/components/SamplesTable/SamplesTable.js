import json from '../../../json/data-variants.json';
import DTable from '../shared/DataTable.js';

import { initializeTable, setColumnFilter } from '../../actions'

import store from '../../containers/App'


//datatables.net Gen Samples table   
//

const $tableEl = $('#samples_table');
const $tableHeaderEl = $('#samples_table_wrapper thead');

const dtConfig = {
  dom: '<"toolbar">frtip',
  orderCellsTop: true,
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
    { "data": "proteinChange", "title": "ProteinChange", "visible": false},
    { "data": "granthamScore", "title": "GranthamScore", "visible": false },
    { "data": "functionalConsequence", "title": "FunctionalConsequence", "visible": false },
    { "data": "transcript", "title": "Transcript", "visible": false },
    { "data": "nucleotideChange", "title": "NucleotideChange", "visible": false }
  ]
};


$( function() {

  const table = new DTable($tableEl, dtConfig ).table;

  store.dispatch(initializeTable(table));

  let unsubscribe = store.subscribe(() => {
    store.getState().samplesTable.draw();
  })


  table.columns().flatten().each( function ( colIdx ) {
    const input = $('<input type="text" placeholder="Search" />')
      .width( $(table.column(colIdx).header()).width() - 10 )
      .on( 'click', (e) => e.stopPropagation(e) )
      .on( 'change keyup', (e) => {
        store.dispatch( setColumnFilter(table, colIdx, $(e.currentTarget).val()) )
      });
  
    const row = $('<div></div>');
    input.appendTo(row);
    row.appendTo(table.column(colIdx).header());
  });

});

//unsubscribe();



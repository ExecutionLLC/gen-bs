import json from '../../../json/data-variants.json';

import { initializeTable, setColumnFilter } from '../../actions'

import store from '../../containers/App'

const $tableElement = $('#variants_table');

$( () => {

  function fillRows(tData) {
      return tData.map( (rowData) => {
        var row = [];

        row.push('<tr>');
        for(var key in rowData) {
          row.push(`<td>${rowData[key]}</td>`);
        }
        row.push('</tr>');

        return row.join();
      });
  }


  function getInitialState() {
    $.get(json, function(data) {
      render(fillRows(data));
    })
  }

  function render(tableRows) {
    $tableElement.append(tableRows)
  }

  getInitialState();



});


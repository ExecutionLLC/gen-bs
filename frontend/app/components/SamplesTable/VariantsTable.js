import json from '../../../json/data-variants.json';

import { fetchVariants } from '../../actions'

import store from '../../containers/App'
import observeStore from '../../utils/observeStore'

const $tableElement = $('#variants_table');


function selectVariants(state) {
  return state.variantsTable.variants
}

function fillTableHead(labels) {
  var head = [];
  head.push('<thead><tr>');

  labels.map( (label) => {
    head.push(`<th>${label}</th>`);
  })
  head.push('</tr></thead>');
  return head.join('');
}

function fillRows(tData) {
    var row = [fillTableHead(Object.keys(tData[0]))];
    tData.map( (rowData) => {

      row.push('<tbody><tr>');
      for(var key in rowData) {
        row.push(`<td>${rowData[key]}</td>`);
      }
      row.push('</tr></tbody>');

    });
    return row.join('');
}

function getInitialState() {
  store.dispatch(fetchVariants());
  observeStore(store, selectVariants, () => {
    const variants = store.getState().variantsTable.variants;
    const isFetching = store.getState().variantsTable.isFetching;
    if(!isFetching) {
      render(fillRows(variants));
    }
  });
}

function render(tableRows) {
  $tableElement.append(tableRows)
}


$( () => { getInitialState() })


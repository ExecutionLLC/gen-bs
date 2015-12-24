import json from '../../../json/data-variants.json';

import { fetchVariants, sortVariants } from '../../actions'

import store from '../../containers/App'
import observeStore from '../../utils/observeStore'

const $tableElement = $('#variants_table');
const tableHeaderElement = '#variants_table thead tr th';


function selectVariants(state) {
  return state.variantsTable.variants
}

function fillTableHead(labels) {
  var head = [];
  head.push('<thead><tr>');

  labels.map( (label) => {
    head.push(`<th data-label="${label}">${label}</th>`);
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
  $tableElement.html(tableRows)
}



$( () => { 
  getInitialState();
  $(document).on('click', tableHeaderElement, (e) => {
    var sortOrder;
    if(store.getState().variantsTable.sortOrder) {
      sortOrder = store.getState().variantsTable.sortOrder[$(e.currentTarget).data('label')] || 'asc';
    } else {
      sortOrder = 'asc';
    }
    store.dispatch(
      sortVariants(
        store.getState().variantsTable.variants,
        $(e.currentTarget).data('label'),
        (sortOrder === 'asc') ? ('desc'):('asc')
    ))
     

  });
});


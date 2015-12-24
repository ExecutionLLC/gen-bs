import json from '../../../json/data-variants.json';

import { fetchVariants } from '../../actions'

import store from '../../containers/App'
import observeStore from '../../utils/observeStore'

const $tableElement = $('#variants_table');


function selectVariants(state) {
  return state.variantsTable.variants
}




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

  getInitialState();



});


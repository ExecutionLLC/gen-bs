import json from '../../../json/data-variants.json';

import { fetchVariants, sortVariants, filterVariants, selectTableRow } from '../../actions'

import store from '../../containers/App'
import observeStore from '../../utils/observeStore'

import '../../assets/vendor/bootstrap3-editable/js/bootstrap-editable'
import '../../assets/vendor/bootstrap3-editable/css/bootstrap-editable.css'


const $tableElement = $('#variants_table');
const tableHeaderSortElement = '#variants_table thead tr th .variants-table-header-label';
const tableHeaderFilterElement = '#variants_table thead tr th input';
const tableRowElement = '#variants_table tbody tr';
const tableCheckboxElement = '#variants_table tbody tr td input[type=checkbox]';

/**
 * POJO with attrs and methods for VariantsTable
 */
var variantsTable = {

  firstCharUpperCase: str => str.charAt(0).toUpperCase() + str.slice(1),


  selectVariants: state => state.variantsTable.variants,

  selectSort: state => state.variantsTable.sortOrder,

  selectFilter: state => state.variantsTable.columnFilters,

  selectRowSelected: state => state.variantsTable.clickedRow,


  fillTableHead: function(labels) {
    var head = [];
    head.push('<tr>');

    head.push(
        `<th data-label="checkbox">
          <input type="checkbox" />
        </th>`);

    head.push(
        `<th data-label="comment">
          <span class="variants-table-header-label">
            Comment
          </span><button class="btn btn-link btnSort"></button>
          <div><input type="text" class="form-control" placeholder="Search coment"></div>
        </th>`);

    labels.map( (label) => {
      if (label !== 'comment') {
        head.push(
            `<th data-label="${label}">
              <span class="variants-table-header-label">
                ${this.firstCharUpperCase(label)}
              </span><button class="btn btn-link btnSort"></button>
              <div><input type="text"  class="form-control" placeholder="Search ${label}"></div>
            </th>`);
      }
    })
    head.push('</tr>');
    return head.join('');
  },


  fillRows: (tData) => {
    var row = [];

    tData.map( (rowData) => {
      row.push(`<tr id=${rowData._fid} class="${rowData._selected ? 'success': ''}">`);
      
      // checkbox
      row.push(`<td><input type="checkbox" /></td>`);

      row.push(`<td class="comment">${rowData['comment']}</td>`);

      for(var key in rowData) {
        if(key !== 'comment') {
          row.push(`<td class="${key}">${rowData[key]}</td>`);
        }
      }
      row.push('</tr>');
    });

    return row.join('');
  },


  getInitialState: function() {
    store.dispatch(fetchVariants());

    observeStore(store, this.selectFilter, () => {
      const filteredVariants = store.getState().variantsTable.filteredVariants;
      this.render(this.fillRows(filteredVariants));
    });

    observeStore(store, this.selectSort, () => {
      const filteredVariants = store.getState().variantsTable.filteredVariants;
      this.render(this.fillRows(filteredVariants));
    });

    observeStore(store, this.selectVariants, () => {
      const variants = store.getState().variantsTable.filteredVariants;
      const isFetching = store.getState().variantsTable.isFetching;
      if(!isFetching) {
        this.renderHead(this.fillTableHead(Object.keys(variants[0])));
        this.render(this.fillRows(variants));
      }
    });

    observeStore(store, this.selectRowSelected, () => {
      const rowId = store.getState().variantsTable.clickedRow._fid;
      const selected = _.find(store.getState().variantsTable.filteredVariants, { _fid: rowId })._selected;
      console.log('select', selected);
      //const selected = false;
      var $row = $(tableRowElement + '#' + rowId);
      var $checkbox = $(tableRowElement + '#' + rowId + ' td input[type=checkbox]');
      $row.toggleClass('active');
      $checkbox.prop('checked', selected);
    });
  },

  render: (tableRows) => {
    $('#variants_table_body').html(tableRows);
    $('td.comment').editable({
      mode: 'popup',
      type: 'textarea'
    });
  },

  renderHead(tableHead) { $('#variants_table_head').html(tableHead) },


  subscribeToSort: () => {
    $(document).on('click', tableHeaderSortElement, (e) => {
      const key = $(e.currentTarget).parent().data('label');
      var sortOrder;
      if(store.getState().variantsTable.sortOrder) {
        sortOrder = store.getState().variantsTable.sortOrder[key] || 'asc';
      } else {
        sortOrder = 'asc';
      }
      store.dispatch(
        sortVariants(
          store.getState().variantsTable.filteredVariants,
          key,
          (sortOrder === 'asc') ? ('desc'):('asc')
      ))
    });
  },


  subscribeToFilter: () => {
    $(document).on('change keyup', tableHeaderFilterElement, (e) => {
      const key = $(e.currentTarget).parent().parent().data('label');
      const value = $(e.currentTarget).val();
      store.dispatch(
        filterVariants(
          store.getState().variantsTable.variants,
          key,
          value
      ))
    });
  },

  _selectRow: (e) => {
    const $row = $(e.currentTarget).parent().parent();
    const _fid = $(e.currentTarget).parent().parent().attr('id');

    store.dispatch( selectTableRow(parseInt(_fid)) );
  },

  subscribeToSelectRows: function () {
    $(document).on('change', tableCheckboxElement, (e) => {
      const _fid = $(e.currentTarget).parent().parent().attr('id');

      store.dispatch( selectTableRow(_fid) )
      //this._selectRow(e);
    });

    $(document).on('click', tableRowElement, (e) => {
      const _fid = $(e.currentTarget).attr('id');

      store.dispatch( selectTableRow(parseInt(_fid)) )
      //this._selectRow(e);
    });
  }

}



$( () => { 
  variantsTable.getInitialState();
  variantsTable.subscribeToSort();
  variantsTable.subscribeToFilter();
  variantsTable.subscribeToSelectRows();
});


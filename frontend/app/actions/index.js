
export const COLUMN_FILTER = 'COLUMN_FILTER'

function() columnFilter(columnId) {
  return {
    type: COLUMN_FILTER,
    columnId
  }
}


export const CHANGE_VIEW = 'CHANGE_VIEW'

/*
 * Action Creators
 */

export function changeView(views, selectedViewId) {
  return {
    type: CHANGE_VIEW,
    views,
    selectedViewId
  }
}


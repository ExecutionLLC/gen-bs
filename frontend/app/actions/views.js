export const CHANGE_VIEW = 'CHANGE_VIEW'

/*
 * Action Creators
 */

export function changeView(selectedView) {
  return {
    type: CHANGE_VIEW,
    selectedView
  }
}


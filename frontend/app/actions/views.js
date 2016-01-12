export const CHANGE_VIEW = 'CHANGE_VIEW'

/*
 * Action Creators
 */

// TODO: move views list from here or from user_data
export function changeView(views, selectedViewId) {
  return {
    type: CHANGE_VIEW,
    views,
    selectedViewId
  }
}


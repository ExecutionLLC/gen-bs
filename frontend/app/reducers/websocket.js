import * as ActionTypes from '../actions/websocket'

export default function websocket(state = {
  wsConn: null,
  lastMessageSended: null,
  messages: [],
  errors: [],
  closed: true,
  variants: null,
  isVariantsEmpty: true,
  progress: null
}, action) {
  switch (action.type) {
    case ActionTypes.WS_CREATE_CONNECTION:
        return Object.assign({}, state, {
          wsConn: action.wsConn
        })
    case ActionTypes.WS_TABLE_MESSAGE:
        return Object.assign({}, state, {
          messages: [
            ...state.messages,
            action.wsData
          ],
          variants: action.wsData.result.data,
          isVariantsEmpty: (action.wsData.result.data.length === 0)
        })
    case ActionTypes.WS_PROGRESS_MESSAGE:
        return Object.assign({}, state, {
          messages: [
            ...state.messages,
            action.wsData
          ],
          progress: action.wsData.result.progress
        })
    case ActionTypes.WS_OTHER_MESSAGE:
        return Object.assign({}, state, {
          messages: [
            ...state.messages,
            action.wsData
          ]
        })
    case ActionTypes.WS_RECEIVE_ERROR:
        return Object.assign({}, state, {
          errors: [
            ...state.errors,
            action.err
          ]
        })
    case ActionTypes.WS_RECEIVE_CLOSE:
        return Object.assign({}, state, {
          closed: true
        })
    case ActionTypes.WS_SEND_MESSAGE:
        return Object.assign({}, state, {
          lastMessageSended: action.msg
        })

    default:
      return state
  }
}

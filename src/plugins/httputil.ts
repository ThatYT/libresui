import api from './api'
import { i18n } from '@/locales'
import router from '@/router'
import { push } from 'notivue'

export interface Msg {
  success: boolean
  msg: string
  obj: any | null
}

function errorText(message: string): string {
  // The backend returns English error strings; localize known UI validation
  // messages while retaining addresses and other diagnostic details.
  const separator = message.indexOf(': ')
  const action = separator >= 0 ? message.slice(0, separator) : ''
  const detail = separator >= 0 ? message.slice(separator + 2) : message
  let text = detail
  if (detail.startsWith('wrong user or password! IP: ')) {
    text = i18n.global.t('login.invalidCredentials') + ' IP: ' + detail.slice('wrong user or password! IP: '.length)
  } else {
    const errors: Record<string, string> = {
      'wrong password': 'login.invalidPassword',
      'username can not be empty': 'login.unRules',
      'password can not be empty': 'login.pwRules',
      'tls in use': 'ui.tlsInUse',
      'remote server not found': 'ui.serverNotFound',
      'invalid token': 'ui.invalidToken',
    }
    if (errors[detail]) text = i18n.global.t(errors[detail])
  }
  if (action && i18n.global.te('actions.' + action)) {
    return i18n.global.t('actions.' + action) + ': ' + text
  }
  return text === detail ? message : text
}

function _handleMsg(msg: any): void {
  if (!isMsg(msg)) {
    return
  }
  if(msg.msg){
    if (!msg.success && msg.msg == "Invalid login") {
      push.error({
        title: i18n.global.t('invalidLogin'),
      })
      logout()
      return
    }
    if (msg.success) {
      push.success({
        message: i18n.global.t('success') + ": " + i18n.global.t('actions.' + msg.msg),
      })
    } else {
      push.error({
        title: i18n.global.t('failed'),
        message: errorText(msg.msg)
      })
    }
  }
}

export const logout = async () => {
  const response = await HttpUtils.get('api/logout')
  if(response.success){
    router.push('/login')
  }
}

function _respToMsg(resp: any): Msg {
  const data = resp.data
  if (data == null) {
    return { success: true, msg: "", obj: null }
  } else if (isMsg(data)) {
    if (data.hasOwnProperty('success')) {
        return { success: data.success, msg: data.msg, obj: data.obj || null }
    } else {
        return data
    }
  } else {
    return { success: false, msg: i18n.global.t('ui.unknownResponse', { data: String(data) }), obj: null }
  }
}

function isMsg(obj: any): obj is Msg {
  return Object.hasOwn(obj,'success') && Object.hasOwn(obj,'msg') && Object.hasOwn(obj, 'obj')
}
  
// Currently managed remote server id ('' = this local panel). When set, API
// calls carry X-Remote-Server so the backend forwards them to that server's
// APIv2 (the central-management proxy).
let currentRemote = ''
export function setRemoteServer(id: string | number | null) {
  currentRemote = id ? String(id) : ''
}
export function getRemoteServer(): string {
  return currentRemote
}

const HttpUtils = {
  async get(url: string, data: object = {}, options: any[] = []): Promise<Msg> {
    let msg: Msg
    try {
        const config: any = { params: data, ...options }
        if (currentRemote) config.headers = { ...(config.headers || {}), 'X-Remote-Server': currentRemote }
        const resp = await api.get(url, config)
        msg = _respToMsg(resp)
    } catch (e: any) {
        msg = { success: false, msg: e.toString(), obj: null }
    }
    _handleMsg(msg)
    return msg
  },
  async post(url: string, data: object | null, options: any = undefined): Promise<Msg> {
    let msg: Msg
    try {
        const config: any = { ...(options || {}) }
        if (currentRemote) config.headers = { ...(config.headers || {}), 'X-Remote-Server': currentRemote }
        const resp = await api.post(url, data, config)
        msg = _respToMsg(resp)
    } catch (e: any) {
        msg = { success: false, msg: e.toString(), obj: null }
    }
    _handleMsg(msg)
    return msg
  },
}

export default HttpUtils
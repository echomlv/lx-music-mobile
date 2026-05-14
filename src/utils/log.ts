// import { requestStoragePermission } from '@/utils/common'
import { temporaryDirectoryPath, existsFile, appendFile, unlink, writeFile, readFile } from '@/utils/fs'

const logPath = temporaryDirectoryPath + '/error.log'

// 把开发机/构建机的本机绝对路径脱敏,仅保留项目内相对路径。
// /Users/xxx/.../lx-music-mobile(-ios)?/...        → ...
// 其它残留的 /Users/xxx/...                          → ~/...
// file:// 前缀 与 Metro http://localhost:8081/... 前缀同样裁掉
const PROJECT_ROOT_RE = /(?:file:\/\/)?\/[^\s)'"]*?\/lx-music-mobile(?:-ios)?\//g
const USER_HOME_RE = /\/Users\/[^/\s)'"]+\//g
const METRO_BUNDLE_RE = /https?:\/\/[^/\s)'"]+:\d+\//g

export const scrubPaths = (msg: string): string => {
  return msg
    .replace(PROJECT_ROOT_RE, '')
    .replace(METRO_BUNDLE_RE, '')
    .replace(USER_HOME_RE, '~/')
}

const logTools = {
  tempLog: [] as Array<{ time: string, type: 'LOG' | 'WARN' | 'ERROR', text: string }> | null,
  writeLog(msg: string) {
    const cleaned = scrubPaths(msg)
    console.log(cleaned)
    void appendFile(logPath, '\n----lx log----\n' + cleaned)
  },
  async initLogFile() {
    try {
      let isExists = await existsFile(logPath)
      // console.log(isExists)
      if (!isExists) await writeFile(logPath, '')
      if (this.tempLog?.length) this.writeLog(this.tempLog.map(m => `${m.time} ${m.type} ${m.text}`).join('\n----lx log----\n'))
      this.tempLog = null
    } catch (err) {
      console.log(err)
    }
  },
}

export const init = async() => {
  return logTools.initLogFile()
}

export const getLogs = async() => {
  return readFile(logPath)
}

export const clearLogs = async() => {
  return unlink(logPath).then(async() => writeFile(logPath, ''))
}

export const log = {
  info(...msgs: any[]) {
    // console.info(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : m instanceof Error ? m.stack ?? m.message : JSON.stringify(m)).join(' ')
    if (msg.startsWith('%c')) return
    const time = new Date().toLocaleString()
    if (logTools.tempLog) {
      logTools.tempLog.push({ type: 'LOG', time, text: msg })
    } else logTools.writeLog(`${time} LOG ${msg}`)
  },
  warn(...msgs: any[]) {
    // console.warn(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : m instanceof Error ? m.stack ?? m.message : JSON.stringify(m)).join(' ')
    const time = new Date().toLocaleString()
    if (logTools.tempLog) {
      logTools.tempLog.push({ type: 'WARN', time, text: msg })
    } else logTools.writeLog(`${time} WARN ${msg}`)
  },
  error(...msgs: any[]) {
    const msg = msgs.map(m => typeof m == 'string' ? m : m instanceof Error ? m.stack ?? m.message : JSON.stringify(m)).join(' ')
    const time = new Date().toLocaleString()
    if (logTools.tempLog) {
      logTools.tempLog.push({ type: 'ERROR', time, text: msg })
    } else {
      logTools.writeLog(`${time} ERROR ${msg}`)
    }
  },
}
/*
if (process.env.NODE_ENV !== 'development') {
  const logPath = externalDirectoryPath + '/debug.log'

  let tempLog = []

  const log = window.console.log
  const error = window.console.error
  const warn = window.console.warn

  const writeLog = msg => appendFile(logPath, '\n' + msg)

  window.console.log = (...msgs) => {
    log(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : JSON.stringify(m)).join(' ')
    if (msg.startsWith('%c')) return
    const time = new Date().toLocaleString()
    if (tempLog) {
      tempLog({ type: 'LOG', time, text: msg })
    } else writeLog(`${time} LOG ${msg}`)
  }
  window.console.error = (...msgs) => {
    error(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : JSON.stringify(m)).join(' ')
    const time = new Date().toLocaleString()
    if (tempLog) {
      tempLog({ type: 'ERROR', time, text: msg })
    } else writeLog(`${time} ERROR ${msg}`)
  }
  window.console.warn = (...msgs) => {
    warn(...msgs)
    const msg = msgs.map(m => typeof m == 'string' ? m : JSON.stringify(m)).join(' ')
    const time = new Date().toLocaleString()
    if (tempLog) {
      tempLog({ type: 'WARN', time, text: msg })
    } else writeLog(`${time} WARN ${msg}`)
  }

  const init = async() => {
    try {
      let result = await requestStoragePermission()
      if (!result) return
      let isExists = await existsFile(logPath)
      console.log(logPath, isExists)
      if (!isExists) await writeFile(logPath, '')
      writeLog(tempLog(m => `${m.time} ${m.type} ${m.text}`).join('\n'))
      tempLog = null
    } catch (err) {
      console.error(err)
    }
  }


  init()
}

 */

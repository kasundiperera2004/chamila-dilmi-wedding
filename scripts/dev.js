import { spawn } from 'node:child_process'
import path from 'node:path'

const isWindows = process.platform === 'win32'
const viteBin = path.join('node_modules', '.bin', isWindows ? 'vite.cmd' : 'vite')
const viteArgs = ['--config', 'frontend/vite.config.js', ...process.argv.slice(2)]

const children = [
  spawn(process.execPath, ['backend/index.js'], { stdio: 'inherit' }),
  spawn(viteBin, viteArgs, { stdio: 'inherit', shell: isWindows }),
]

let shuttingDown = false

const stopChildren = () => {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  children.forEach((child) => {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  })
}

children.forEach((child) => {
  child.on('exit', (code, signal) => {
    if (!shuttingDown && code !== 0) {
      stopChildren()
      process.exitCode = code || (signal ? 1 : 0)
    }
  })
})

process.on('SIGINT', () => {
  stopChildren()
  process.exit()
})

process.on('SIGTERM', () => {
  stopChildren()
  process.exit()
})

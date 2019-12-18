import { commands } from 'vscode'
import { showDocument } from '../utils'

export function openFile() {
    return commands.registerCommand('fileShortcut.openFile', (path) => {
        showDocument(path)
    })
}

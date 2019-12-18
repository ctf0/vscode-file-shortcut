import { commands, window } from 'vscode'
import { getConf, updateConf } from '../utils'

export function addCurrentFile() {
    return commands.registerCommand('fileShortcut.addCurrentFile', async (e) => {
        let list: any[] = await getConf('list')
        let path = e ? e.fsPath : window.activeTextEditor.document.uri.fsPath

        list.push(path)
        updateConf('list', list)
    })
}

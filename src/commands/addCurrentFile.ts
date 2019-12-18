import {commands, window} from 'vscode'
import {getConf, updateConf, showMsg} from '../utils'

export function addCurrentFile() {
    return commands.registerCommand('fileShortcut.addCurrentFile', async (e) => {
        let list: any[] = await getConf('list')
        let path = e ? e.fsPath : window.activeTextEditor.document.uri.fsPath

        if (list.includes(path)) {
            return showMsg('already added')
        }

        list.push(path)
        updateConf('list', list)
        showMsg('file added', false)
    })
}

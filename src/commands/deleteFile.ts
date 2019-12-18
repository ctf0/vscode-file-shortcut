import {commands, window} from 'vscode'
import {getConf, updateConf, showMsg} from '../utils'

export function deleteFile() {
    return commands.registerCommand('fileShortcut.deleteFile', async (e) => {
        let list: any[] = await getConf('list')
        let path = e
            ? e.id // from the activity bar
                ? e.id
                : e.fsPath // from explorer tree view
            : window.activeTextEditor.document.uri.fsPath // from quick panel
        let i = list.findIndex((item) => item == path)

        if (i < 0) {
            return showMsg('file not in list')
        }

        list.splice(i, 1)
        updateConf('list', list)
        showMsg('file removed')
    })
}

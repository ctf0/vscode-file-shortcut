import { commands, window } from 'vscode'
import * as util from '../utils'
export { showFileList } from './showFileList'

export function addCurrentFile() {
    return commands.registerCommand('fileShortcut.addCurrentFile', async (e) => {
        try {
            let list: any[] = await util.getConf('list')
            let doc = window.activeTextEditor.document
            let path = e ? e.fsPath : doc.uri.fsPath

            if (list.includes(path)) {
                return util.showMsg('already added')
            }

            list.push(path)
            util.updateConf('list', list)
            util.showMsg('file added', false)
        } catch ({ message }) {
            util.showMsg('sorry, this file type cant be added !', true)
        }
    })
}
export function deleteFile() {
    return commands.registerCommand('fileShortcut.deleteFile', async (e) => {
        let list: any[] = await util.getConf('list')
        let path = e
            ? e.id // from the activity bar
                ? e.id
                : e.fsPath // from explorer tree view
            : window.activeTextEditor.document.uri.fsPath // from quick panel
        let i = list.findIndex((item) => item == path)

        if (i < 0) {
            return util.showMsg('file not in list')
        }

        list.splice(i, 1)
        util.updateConf('list', list)
        util.showMsg('file removed')
    })
}

export function openFile() {
    return commands.registerCommand('fileShortcut.openFile', (path, type) => {
        util.showDocument(path)

        if (type == 'treeview') {
            let time = util.getConf('hideSidebarTimeOut')

            if (time > 0) {
                setTimeout(() => {
                    commands.executeCommand('workbench.action.toggleSidebarVisibility')
                }, time * 1000)
            }
        }
    })
}

import { window } from 'vscode'
import { showFileList, addCurrentFile, deleteFile, openFile } from './commands'
import TreeProvider from './treeProvider'

export function activate({ subscriptions }) {
    subscriptions.push(showFileList())
    subscriptions.push(addCurrentFile())
    subscriptions.push(deleteFile())
    subscriptions.push(openFile())

    window.registerTreeDataProvider('list', new TreeProvider())
}

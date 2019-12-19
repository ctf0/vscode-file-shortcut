import {window} from 'vscode'
import * as commands from './commands'
import TreeProvider from './treeProvider'

export function activate({subscriptions}) {
    subscriptions.push(commands.openFile())
    subscriptions.push(commands.addCurrentFile())
    subscriptions.push(commands.deleteFile())
    subscriptions.push(commands.showFileList())

    window.registerTreeDataProvider('list', new TreeProvider())
}

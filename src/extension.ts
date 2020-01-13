import { window, commands } from 'vscode'
import * as cmnds from './commands'
import TreeProvider from './treeProvider'

export function activate({ subscriptions }) {
    setContext(false)

    // current
    let editor = window.activeTextEditor

    if (editor && isAFile(editor)) {
        setContext(true)
    }

    // on new document
    window.onDidChangeVisibleTextEditors(async (editors) => {
        setContext(false)

        for (const editor of editors) {
            if (isAFile(editor)) {
                setContext(true)
                break
            }
        }
    })

    subscriptions.push(cmnds.openFile())
    subscriptions.push(cmnds.addCurrentFile())
    subscriptions.push(cmnds.deleteFile())
    subscriptions.push(cmnds.showFileList())

    window.registerTreeDataProvider('fs_list', new TreeProvider())
}

function setContext(val, key = 'fscEnabled') {
    commands.executeCommand('setContext', key, val)
}

function isAFile({ document }) {
    return document.fileName.includes('/')
}

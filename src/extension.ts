import { window, commands, workspace } from 'vscode'
import * as cmnds from './commands'
import * as util from './utils'
import TreeProvider from './treeProvider'

export function activate({ subscriptions }) {
    setContext(false)
    checkForListLength()

    util.setUnGroupedListName()

    // on config change
    workspace.onDidChangeConfiguration((e: any) => {
        if (e.affectsConfiguration('fileShortcut')) {
            util.setUnGroupedListName()
            checkForListLength()
        }
    })

    // current file
    let editor = window.activeTextEditor

    if (editor && isAFile(editor)) {
        setContext(true)
    }

    // on new document
    window.onDidChangeActiveTextEditor(async (editor) => {
        setContext(false)

        if (editor && isAFile(editor)) {
            setContext(true)
        }
    })

    subscriptions.push(cmnds.openFile())
    subscriptions.push(cmnds.addCurrentFile())
    subscriptions.push(cmnds.deleteFile())
    subscriptions.push(cmnds.showFileList())
    subscriptions.push(cmnds.sortTreeList())

    subscriptions.push(cmnds.deleteGroup())
    subscriptions.push(cmnds.renameGroup())
    subscriptions.push(cmnds.changeFileGroup())
    window.registerTreeDataProvider('fs_list', new TreeProvider())
}

function setContext(val, key = 'fscEnabled') {
    commands.executeCommand('setContext', key, val)
}

function isAFile({ document }) {
    return document.fileName.includes('/')
}

function checkForListLength() {
    setContext(false, 'fscHasFiles')

    if (util.getConf('list').length) {
        setContext(true, 'fscHasFiles')
    }
}

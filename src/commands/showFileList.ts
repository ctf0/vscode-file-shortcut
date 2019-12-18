import {commands, window} from 'vscode'
import {getConf, showDocument, showMsg} from '../utils'
const debounce = require('lodash.debounce')

export function showFileList() {
    return commands.registerCommand('fileShortcut.showFileList', async () => {
        let filePaths: any[] = await getConf('list')

        if (!filePaths.length) {
            return showMsg('no list found')
        }

        // enable preview mode
        showQuickPick(filePaths)
    })
}

async function showQuickPick(filePaths: string[]) {
    await window.showQuickPick(filePaths, {
        placeHolder: 'Pick a file to open',
        onDidSelectItem: debounce(async function (item: string) {
            return showDocument(item)
        }, 300)
    }).then((selection) => {
        if (selection) {
            return openFile(selection)
        }
    })
}

async function openFile(filePath: string) {
    try {
        showDocument(filePath)
    } catch (error) {
        if (error.message.includes('cannot open file')) {
            showMsg(`"${filePath}" not found`)
        }
    }
}

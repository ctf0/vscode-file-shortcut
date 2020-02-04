import { commands, window, workspace } from 'vscode'
import * as util from '../utils'
const debounce = require('lodash.debounce')

export function showFileList() {
    return commands.registerCommand('fileShortcut.showFileList', async () => {
        let filePaths = []
        let list = util.getConf('list')

        for (let i = 0; i < list.length; i++) {
            const item = list[i]

            if (typeof item == 'string') {
                filePaths.push(item)
            } else {
                filePaths.push(...item.documents)
            }
        }

        if (!filePaths.length) {
            return util.showMsg('no list found')
        }

        // enable preview mode
        showQuickPick(filePaths)
    })
}

async function showQuickPick(filePaths: string[]) {
    let oldConfig = workspace.getConfiguration('workbench').get('editor.enablePreview')
    workspace.getConfiguration().update('workbench.editor.enablePreview', true, false)

    await window.showQuickPick(filePaths, {
        placeHolder: 'Pick a file to open',
        onDidSelectItem: debounce(async function (item: string) {
            return util.showDocument(item)
        }, 300)
    }).then(async (selection) => {
        if (selection) {
            await openFile(selection)
            workspace.getConfiguration().update('workbench.editor.enablePreview', oldConfig, false)
        }
    })
}

async function openFile(filePath: string) {
    try {
        util.showDocument(filePath)
    } catch (error) {
        if (error.message.includes('cannot open file')) {
            util.showMsg(`"${filePath}" not found`)
        }
    }
}

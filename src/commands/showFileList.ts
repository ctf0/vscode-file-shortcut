import { commands, window, workspace } from 'vscode'
import { getConf, showDocument } from '../utils'

export function showFileList() {
    return commands.registerCommand('fileShortcut.showFileList', async () => {
        let filePaths: any[] = await getConf('list')

        if (!filePaths.length) {
            return window.showErrorMessage('File Shortcut: No list found')
        }

        showQuickPick(filePaths)
    })
}

async function showQuickPick(filePaths: string[]) {
    // enable preview mode
    const preview = workspace.getConfiguration('workbench.editor').get('enablePreview')
    workspace.getConfiguration().update('workbench.editor.enablePreview', false, true)

    await window.showQuickPick(filePaths, {
        placeHolder: 'Pick a file to open',
        onDidSelectItem: async (item: string) => {
            showDocument(item)
        }
    }).then((selection) => {
        // restore preview mode
        workspace.getConfiguration().update('workbench.editor.enablePreview', preview, true)

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
            window.showErrorMessage(`File: "${filePath}" not found`)
        }
    }
}

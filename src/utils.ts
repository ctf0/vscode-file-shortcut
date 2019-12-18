import {workspace, window} from 'vscode'

// config
export function getConf(key: string) {
    return workspace.getConfiguration('fileShortcut')[key]
}

export function updateConf(key: string, val: any) {
    return workspace.getConfiguration().update(`fileShortcut.${key}`, val, true)
}

// document
export function getFileName(path: string) {
    return path.split('/').pop()
}

export async function showDocument(path) {
    let document = await workspace.openTextDocument(path)

    return await window.showTextDocument(document, {
        preview: true,
        preserveFocus: true
    })
}

export async function showMsg(txt, error = true) {
    error
        ? window.showErrorMessage(`File Shortcut: ${txt}`)
        : window.showInformationMessage(`File Shortcut: ${txt}`)
}

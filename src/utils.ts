import { workspace, window } from 'vscode'

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

export async function showDocument(path, preserveFocus = true) {
    let document = await workspace.openTextDocument(path)

    await window.showTextDocument(document, {
        viewColumn: getConf('OpenInNewGroup') ? -2 : 1,
        preview: preserveFocus,
        preserveFocus: preserveFocus
    })
}

export async function showMsg(txt, error = true) {
    error
        ? window.showErrorMessage(`File Shortcut: ${txt}`)
        : window.showInformationMessage(`File Shortcut: ${txt}`)
}

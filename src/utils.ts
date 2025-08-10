import * as Npath from 'node:path'
import {ConfigurationTarget, window, workspace} from 'vscode'

export const CMND_NAME = 'fileShortcut'
export const SHOW_FILE_NAME_IN_LIST_AS = {
    nameAndAlias: 1,
    aliasOnly: 2,
}

export type Scope = 'workspace' | 'global'

/* Config ------------------------------------------------------------------- */
export function getConf(key: string) {
    const cfg = workspace.getConfiguration(CMND_NAME)
    const insp = cfg.inspect(key)

    // Prefer workspace value when defined; else fall back to user/global; else default
    if (insp && typeof insp.workspaceValue !== 'undefined') {
        return insp.workspaceValue
    }

    if (insp && typeof insp.globalValue !== 'undefined') {
        return insp.globalValue
    }

    return (insp ? insp.defaultValue : cfg.get(key))
}

export function updateConf(key: string, val: any) {
    const hasWorkspace = Array.isArray(workspace.workspaceFolders) && workspace.workspaceFolders.length > 0
    const target = hasWorkspace ? ConfigurationTarget.Workspace : ConfigurationTarget.Global

    return workspace.getConfiguration().update(`${CMND_NAME}.${key}`, val, target)
}

export function getConfByScope(key: string, scope: Scope): T {
    const cfg = workspace.getConfiguration(CMND_NAME)
    const insp = cfg.inspect(key)

    if (!insp) {
        return cfg.get(key)
    }

    if (scope === 'workspace') {
        return (typeof insp.workspaceValue !== 'undefined' ? insp.workspaceValue : insp.defaultValue)
    }

    return (typeof insp.globalValue !== 'undefined' ? insp.globalValue : insp.defaultValue)
}

export function updateConfForScope(key: string, val: any, scope: Scope) {
    const target = scope === 'workspace' ? ConfigurationTarget.Workspace : ConfigurationTarget.Global

    return workspace.getConfiguration().update(`${CMND_NAME}.${key}`, val, target)
}

/* Document ----------------------------------------------------------------- */
export function getFileName(doc: string) {
    return Npath.basename(doc)
}

export function getDocPath(doc) {
    if (typeof doc === 'object') {
        return doc.filePath
    }

    return doc
}

export function getDocLabel(
    doc: any,
    showNameAndAlias = false,
    showAliasOnly = false,
): any {
    const filePath = getDocPath(doc)
    const name = getFileName(filePath)

    if (typeof doc === 'object') {
        const alias = doc?.alias

        if (showNameAndAlias) {
            return name + (alias ? ` (${alias})` : '')
        }

        if (showAliasOnly) {
            return alias || name
        }
    }

    return name
}

export async function showDocument(filePath, preserveFocus = true) {
    try {
        const activeColumn = window.activeTextEditor?.viewColumn || 1
        const document = await workspace.openTextDocument(filePath)

        return window.showTextDocument(document, {
            viewColumn: getConf('OpenInNewGroup') ? -2 : activeColumn,
            preview: preserveFocus,
            preserveFocus: preserveFocus,
        })
    } catch (error) {
        return showMsg(`file not found "${filePath}".`)
    }
}

/* Groups ------------------------------------------------------------------- */
export let defGroup: string = '♣'

export function setUnGroupedListName() {
    defGroup = getConf('unGroupedListName')
}

export function getListByType(list, type) {
    return list.filter((e) => typeof e === type)
}

export function getGroups(list) {
    return list
        .map((e) => e.name)
        .filter((e) => e)
        .concat([defGroup])
}

export async function selectOrCreateGroup(list) {
    const newGroup = 'create new group ...'
    const groupsList = getGroups(list).concat([newGroup])
    const selection = await pickAGroup(groupsList)

    if (selection) {
        if (selection === newGroup) {
            const name = await newGroupName(groupsList)

            return name
        }

        return selection
    }

    return null
}

export function newGroupName(groupsList, val = '') {
    return window.showInputBox({
        placeHolder: 'enter a new group name ...',
        value: val,
        validateInput(v) {
            if (!v) {
                return 'you have to add a name'
            } else if (v && groupsList.some((group) => group === v)) {
                return `"${v}" is already taken, try something else`
            } else {
                return ''
            }
        },
    })
}

export async function pickAGroup(list) {
    return window.showQuickPick(list, {placeHolder: 'choose a group ...'})
}

export function getList() {
    return getConf('list')
}

export function getListByScope(scope: Scope) {
    return getConfByScope('list', scope) || []
}

/* Other -------------------------------------------------------------------- */
const pkg_label = 'File Shortcut:'

export async function showMsg(txt, error = true) {
    return error
        ? await window.showErrorMessage(`${pkg_label} ${txt}`)
        : await window.showInformationMessage(`${pkg_label} ${txt}`)
}

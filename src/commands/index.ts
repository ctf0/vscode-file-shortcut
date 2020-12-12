import {commands, window} from 'vscode'
import * as util          from '../utils'
export {showFileList} from './showFileList'

/* File --------------------------------------------------------------------- */
export function addCurrentFile() {
    return commands.registerCommand('fileShortcut.addCurrentFile', async (e) => {
        let list: any[] = util.getConf('list')
        let groupName = await util.selectOrCreateGroup(list)

        if (groupName) {
            let doc = window.activeTextEditor.document
            let path = e ? e.fsPath : doc.uri.fsPath

            if (!doc || !path) {
                return util.showMsg('sorry, this file type cant be added !')
            }

            if (groupName == util.defGroup) {
                list.push(path)
            } else {
                let groupIndex = util.getGroupIndexByName(groupName)

                if (groupIndex > -1) {
                    list[groupIndex].documents.push(path)
                } else {
                    list.unshift({
                        name      : groupName,
                        documents : [path]
                    })
                }
            }

            util.updateConf('list', list)
            util.showMsg('file added', false)
        }
    })
}

export function deleteFile() {
    return commands.registerCommand('fileShortcut.deleteFile', async (e) => {
        let list = util.getConf('list')
        let path = e
            ? e.path // from the activity bar
                ? e.path
                : e.fsPath // from explorer tree view
            : window.activeTextEditor.document.uri.fsPath // from quick panel

        let found = null
        for (let i = 0; i < list.length; i++) {
            const current = list[i]
            let type = typeof current

            if (
                (type == 'string' && current == path) ||
                (type == 'object' && current.documents.some((e) => e == path))
            ) {
                found = {
                    index : i,
                    type  : type
                }
                break
            }
        }

        if (!found) {
            return util.showMsg('file not in list')
        }

        let i = found.index

        if (found.type == 'object') {
            list[i].documents.splice(list[i].documents.indexOf(path), 1)
        } else {
            list.splice(i, 1)
        }

        util.updateConf('list', list)
        util.showMsg('file removed', false)
    })
}

export function openFile() {
    return commands.registerCommand('fileShortcut.openFile', (path, type) => {
        util.showDocument(path, false)

        if (type == 'treeview') {
            let time = util.getConf('hideSidebarTimeOut')

            if (time > 0) {
                setTimeout(() => {
                    commands.executeCommand('workbench.action.toggleSidebarVisibility')
                }, time * 1000)
            }
        }
    })
}

/* Group -------------------------------------------------------------------- */
export function deleteGroup() {
    return commands.registerCommand('fileShortcut.deleteGroup', async (e) => {
        let list = util.getConf('list')
        let group = null
        let children = []

        // tree view
        if (e) {
            group = e.group
            children = e.children
        }
        // cmnd panel
        else {
            group = await util.pickAGroup(util.getGroups(list))
            children = group ? list[util.getGroupIndexByName(group)].documents : []
        }

        if (group) {
            let child = children.length

            if (!child) {
                removeFiles(list, group)
            } else {
                window.showWarningMessage(
                    `File Shortcut: "${group}" (${child} items) will be removed as well, continue ?!`,
                    ...['Yes']
                ).then((e) => {
                    if (e) {
                        if (group == util.defGroup) {
                            util.updateConf('list', util.getListByType(list, 'object'))
                            util.showMsg(`"${group}" files are removed`)
                        } else {
                            removeFiles(list, group)
                        }
                    }
                })
            }
        }
    })
}

export function renameGroup() {
    return commands.registerCommand('fileShortcut.renameGroup', async (e) => {
        let {group} = e
        let list = util.getConf('list')
        let groupsList = util.getGroups(list)
        let name = await util.newGroupName(groupsList, group)

        if (group == util.defGroup) {
            return util.showMsg('plz use the "fileShortcut.unGroupedListName" configuration instead', false)
        }

        if (name) {
            let i = util.getGroupIndexByName(group)
            list[i].name = name
            util.updateConf('list', list)
        }
    })
}

export function changeFileGroup() {
    return commands.registerCommand('fileShortcut.changeFileGroup', async (e) => {
        let list = util.getConf('list')
        let toGroup = await util.selectOrCreateGroup(list)
        let {path, group} = e

        if (toGroup) {
            if (toGroup == group) {
                return util.showMsg('can\'t move to the same group')
            }

            // remove from current group
            if (group == util.defGroup) {
                list.splice(list.indexOf(path), 1)
            } else {
                let gi = util.getGroupIndexByName(group)
                let i = list[gi].documents.indexOf(path)
                list[gi].documents.splice(i, 1)
            }

            // add to new group
            if (toGroup == util.defGroup) {
                list.push(path)
            } else {
                let groupIndex = util.getGroupIndexByName(toGroup)

                if (groupIndex > -1) {
                    list[groupIndex].documents.push(path)
                } else {
                    list.unshift({
                        name      : toGroup,
                        documents : [path]
                    })
                }
            }

            util.updateConf('list', list)
            util.showMsg(`"${path}" moved to "${toGroup}"`, false)
        }
    })
}

function removeFiles(list, group) {
    list.splice(util.getGroupIndexByName(group), 1)
    util.updateConf('list', list)
    util.showMsg(`group "${group}" removed`, false)
}

export function sortTreeList() {
    return commands.registerCommand('fileShortcut.sort', (e) => {
        let sort = util.getConf('sort') == 'length' ? 'alpha' : 'length'

        return util.updateConf('sort', sort)
    })
}

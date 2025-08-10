import {commands, window} from 'vscode'
import * as util from '../utils'
export {showFileList} from './showFileList'

/* File --------------------------------------------------------------------- */
export function toggleFileAlias() {
    return commands.registerCommand(`${util.CMND_NAME}.toggleFileAlias`, async(e) => {
        const {doc, group, scope} = e

        if (!scope) {
            return util.showMsg('scope is required to modify a file')
        }

        const alias = doc?.alias

        const newAlias = await window.showInputBox({
            placeHolder: 'enter alias name',
            prompt: 'leave it empty to remove current alias if any',
            value: alias,
            validateInput(v) {
                if (typeof doc === 'string' && (!v || !v.trim())) {
                    return 'you have to add a name'
                }
            },
        })

        if (alias == newAlias || newAlias == undefined) {
            return
        }

        const list: any[] = util.getListByScope(scope)
        const groupIndex = list.findIndex((item) => item?.name === group)

        if (groupIndex > -1) {
            list[groupIndex].documents = list[groupIndex].documents.map((item) => {
                if (item === doc) {
                    if (newAlias) {
                        item = {
                            filePath: util.getDocPath(item),
                            alias: newAlias || '',
                        }
                    } else {
                        item = util.getDocPath(doc)
                    }
                }

                return item
            })
        }

        await util.updateConfForScope('list', list, scope)
        const type = newAlias ? 'added' : ' removed'

        util.showMsg(`file alias ${type} for "${util.getFileName(util.getDocPath(doc))}"`, false)
    })
}

export function addCurrentFile() {
    return commands.registerCommand(`${util.CMND_NAME}.addCurrentFile`, async(e) => {
        const scope: util.Scope = 'workspace'
        const list: any[] = util.getListByScope(scope)
        const groupName = await util.selectOrCreateGroup(list)

        if (groupName) {
            const doc = window.activeTextEditor?.document
            const filePath = e ? e.fsPath : doc?.uri.fsPath

            if (!filePath) {
                return util.showMsg(
                    "sorry, this file type cant be added !",
                )
            }

            try {
                if (groupName === util.defGroup) {
                    addToList(list, filePath)
                } else {
                    const groupIndex = list.findIndex((item) => item?.name === groupName)

                    if (groupIndex > -1) {
                        addToList(list[groupIndex].documents, filePath)
                    } else {
                        list.unshift({
                            name: groupName,
                            documents: [filePath],
                        })
                    }
                }

                await util.updateConfForScope('list', list, scope)

                util.showMsg(`file "${util.getDocLabel(filePath)}" added to "${groupName}"`, false)
            } catch (error) {
                // console.error(error);
            }
        }
    })
}

export function addCurrentFileGlobal() {
    return commands.registerCommand(`${util.CMND_NAME}.addCurrentFileGlobal`, async(e) => {
        const scope: util.Scope = 'global'
        const list: any[] = util.getListByScope(scope)
        const groupName = await util.selectOrCreateGroup(list)

        if (groupName) {
            const doc = window.activeTextEditor?.document
            const filePath = e ? e.fsPath : doc?.uri.fsPath

            if (!filePath) {
                return util.showMsg(
                    "sorry, this file type cant be added !",
                )
            }

            try {
                if (groupName === util.defGroup) {
                    addToList(list, filePath)
                } else {
                    const groupIndex = list.findIndex((item) => item?.name === groupName)

                    if (groupIndex > -1) {
                        addToList(list[groupIndex].documents, filePath)
                    } else {
                        list.unshift({
                            name: groupName,
                            documents: [filePath],
                        })
                    }
                }

                await util.updateConfForScope('list', list, scope)

                util.showMsg(`file "${util.getDocLabel(filePath)}" added to "${groupName}" (Global)`, false)
            } catch {
                // console.error(error);
            }
        }
    })
}

export function deleteFile() {
    return commands.registerCommand(`${util.CMND_NAME}.deleteFile`, async(e) => {
        const scope: util.Scope | undefined = e.scope

        if (!scope) {
            return util.showMsg('scope is required to delete a file')
        }

        const list: any[] = util.getListByScope(scope)
        const filePath = e.doc
        const groupName = e.group
        const isDefaultGroup = groupName === util.defGroup
        const groupIndex = list.findIndex((item) => item?.name === groupName)

        if (isDefaultGroup) {
            list.splice(list.indexOf(filePath), 1)
        } else {
            list[groupIndex].documents.splice(
                list[groupIndex].documents.indexOf(filePath),
                1,
            )
        }

        await util.updateConfForScope('list', list, scope)

        util.showMsg(`file "${util.getDocLabel(filePath, true)}" removed from "${groupName}"`, false)
    })
}

let timeoutId

export async function openFile() {
    return commands.registerCommand(`${util.CMND_NAME}.openFile`, async(doc, type) => {
        await util.showDocument(util.getDocPath(doc), false)

        if (type === 'treeview') {
            const time = util.getConf('hideSidebarTimeOut')

            if (time > 0) {
                if (timeoutId) {
                    clearTimeout(timeoutId)
                }

                timeoutId = setTimeout(() => {
                    commands.executeCommand('workbench.action.minimizeOtherEditorsHideSidebar')
                }, time * 1000)
            }
        }
    })
}

/* Group -------------------------------------------------------------------- */
export function deleteGroup() {
    return commands.registerCommand(`${util.CMND_NAME}.deleteGroup`, async(e) => {
        const scope: util.Scope | undefined = e?.scope

        if (!scope) {
            return util.showMsg('scope is required to delete a group')
        }

        const list: any[] = util.getListByScope(scope)
        let group: any = null
        let children = []

        // tree view
        if (e) {
            group = e.group
            children = e.children
        }
        // cmnd panel
        else {
            group = await util.pickAGroup(util.getGroups(list))
            const gi = group ? list.findIndex((item) => item?.name === group) : -1

            children = gi > -1 ? list[gi].documents : []
        }

        if (group) {
            const child = children.length

            if (!child) {
                await removeGroupAndChild(list, group, scope)
            } else {
                window.showWarningMessage(
                    `File Shortcut: "${group} & children (${child} items)" will be removed as well, continue ?!`,
                    ...['Yes'],
                ).then(async(yes) => {
                    if (yes) {
                        if (group === util.defGroup) {
                            await util.updateConfForScope('list', util.getListByType(list, 'object'), scope)

                            util.showMsg(`"${group}" files are removed`)
                        } else {
                            await removeGroupAndChild(list, group, scope)
                        }
                    }
                })
            }
        }
    })
}

export function renameGroup() {
    return commands.registerCommand(`${util.CMND_NAME}.renameGroup`, async(e) => {
        const {group, scope} = e

        if (!scope) {
            return util.showMsg('scope is required to rename a group')
        }

        const list: any[] = util.getListByScope(scope)
        const groupsList = util.getGroups(list)
        const name = await util.newGroupName(groupsList, group)

        if (name) {
            const groupIndex = list.findIndex((item) => item?.name === group)

            list[groupIndex].name = name

            await util.updateConfForScope('list', list, scope)
        }
    })
}

export function changeFileGroup() {
    return commands.registerCommand(`${util.CMND_NAME}.changeFileGroup`, async(e) => {
        const scope: util.Scope | undefined = e?.scope

        if (!scope) {
            return util.showMsg('scope is required to move a file')
        }

        const list: any[] = util.getListByScope(scope)
        const toGroup = await util.selectOrCreateGroup(list)

        const {doc, group} = e

        if (!toGroup) {
            return
        }

        if (toGroup === group) {
            return util.showMsg('can\'t move to the same group')
        }

        // remove from current group
        if (group === util.defGroup) {
            list.splice(list.indexOf(doc), 1)
        } else {
            const groupIndex = list.findIndex((item) => item?.name === group)
            const di = list[groupIndex].documents.indexOf(doc)

            list[groupIndex].documents.splice(di, 1)
        }

        // add to new group
        if (toGroup === util.defGroup) {
            list.push(doc)
        } else {
            const groupIndex = list.findIndex((item) => item?.name === toGroup)

            if (groupIndex > -1) {
                list[groupIndex].documents.push(doc)
            } else {
                list.unshift({
                    name: toGroup,
                    documents: [doc],
                })
            }
        }

        await util.updateConfForScope('list', list, scope)

        util.showMsg(`"${util.getDocLabel(doc)}" moved from "${group}" to "${toGroup}"`, false)
    })
}

async function removeGroupAndChild(list, group, scope?: util.Scope) {
    if (group == util.defGroup) {
        return util.showMsg(`default group "${group}" cant be removed`)
    }

    const groupIndex = list.findIndex((item) => item?.name === group)

    if (groupIndex === -1) {
        return util.showMsg(`group "${group}" not found`)
    }

    list.splice(groupIndex, 1)

    await util.updateConfForScope('list', list, scope!)

    util.showMsg(`group "${group}" removed`, false)
}

// Tree
export function sortTreeList() {
    return commands.registerCommand(`${util.CMND_NAME}.sort`, (e) => {
        const sortType = util.getConf('sort') === 'length' ? 'alpha' : 'length'

        return util.updateConf('sort', sortType)
    })
}

export function treeFileNameDisplay() {
    return commands.registerCommand(`${util.CMND_NAME}.DisplayFileNameInListAs`, (e) => {
        const displayType = util.getConf('DisplayFileNameInListAs') === util.SHOW_FILE_NAME_IN_LIST_AS.nameAndAlias
            ? util.SHOW_FILE_NAME_IN_LIST_AS.aliasOnly
            : util.SHOW_FILE_NAME_IN_LIST_AS.nameAndAlias

        return util.updateConf('DisplayFileNameInListAs', displayType)
    })
}

function addToList(list: any[], file: any) {
    const exists = list.some(function(item) {
        return typeof item === 'object'
            ? item.filePath === file
            : item === file
    })

    if (exists) {
        util.showMsg(`File "${file}" is already in the list`, true)
        throw new Error(`File "${file}" is already in the list`)
    }

    return list.push(file)
}

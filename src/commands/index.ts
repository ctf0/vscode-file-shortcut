import { commands, window } from 'vscode';
import * as util from '../utils';
export { showFileList } from './showFileList';

/* File --------------------------------------------------------------------- */
export function toggleFileAlias() {
    return commands.registerCommand(`${util.CMND_NAME}.toggleFileAlias`, async (e) => {
        const { doc, group } = e;
        const alias = doc?.alias;

        const newAlias = await window.showInputBox({
            placeHolder: 'enter alias name',
            prompt: 'leave it empty to remove current alias if any',
            value: alias,
            validateInput(v) {
                if (typeof doc === 'string' && (!v || !v.trim())) {
                    return 'you have to add a name';
                }
            },
        });

        if (alias == newAlias || newAlias == undefined) {
            return;
        }

        const list: any[] = util.getList();
        const groupIndex = util.getGroupIndexByName(group);

        if (groupIndex > -1) {
            list[groupIndex].documents = list[groupIndex].documents.map((item) => {
                if (item === doc) {
                    if (newAlias) {
                        item = {
                            filePath: util.getDocPath(item),
                            alias: newAlias || '',
                        };
                    } else {
                        item = util.getDocPath(doc);
                    }
                }

                return item;
            });
        }

        await util.updateConf('list', list);
        const type = newAlias ? 'added' : ' removed';

        util.showMsg(`file alias ${type} for "${util.getFileName(util.getDocPath(doc))}"`, false);
    });
}

export function addCurrentFile() {
    return commands.registerCommand(`${util.CMND_NAME}.addCurrentFile`, async (e) => {
        const list: any[] = util.getList();
        const groupName = await util.selectOrCreateGroup(list);

        if (groupName) {
            const doc = window.activeTextEditor?.document;
            const filePath = e ? e.fsPath : doc?.uri.fsPath;

            if (!doc || !filePath) {
                return util.showMsg('sorry, this file type cant be added !');
            }

            if (groupName === util.defGroup) {
                list.push(filePath);
            } else {
                const groupIndex = util.getGroupIndexByName(groupName);

                if (groupIndex > -1) {
                    list[groupIndex].documents.push(filePath);
                } else {
                    list.unshift({
                        name: groupName,
                        documents: [filePath],
                    });
                }
            }

            await util.updateConf('list', list);
            util.showMsg('file added', false);
        }
    });
}

export function deleteFile() {
    return commands.registerCommand(`${util.CMND_NAME}.deleteFile`, async (e) => {
        const list: any[] = util.getList();
        const filePath = e
            ? e.doc // from the activity bar
                ? e.doc
                : e.fsPath // from explorer tree view
            : window.activeTextEditor?.document.uri.fsPath; // from quick panel

        let found: any;

        for (let i = 0; i < list.length; i++) {
            const current = list[i];
            const type = typeof current;

            if (
                (type === 'string' && current === filePath) ||
                (type === 'object' && current.documents.some((doc) => doc === filePath))
            ) {
                found = {
                    index: i,
                    type: type,
                };
                break;
            }
        }

        if (!found) {
            return util.showMsg('file not in list');
        }

        const i = found.index;

        if (found.type === 'object') {
            list[i].documents.splice(list[i].documents.indexOf(filePath), 1);
        } else {
            list.splice(i, 1);
        }

        await util.updateConf('list', list);
        util.showMsg(`file "${util.getDocLabel(filePath, true)}" removed`, false);
    });
}

let timeoutId;
export async function openFile() {
    return commands.registerCommand(`${util.CMND_NAME}.openFile`, async (doc, type) => {
        await util.showDocument(util.getDocPath(doc), false);

        if (type === 'treeview') {
            const time = util.getConf('hideSidebarTimeOut');

            if (time > 0) {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                timeoutId = setTimeout(() => {
                    commands.executeCommand('workbench.action.minimizeOtherEditorsHideSidebar');
                }, time * 1000);
            }
        }
    });
}

/* Group -------------------------------------------------------------------- */
export function deleteGroup() {
    return commands.registerCommand(`${util.CMND_NAME}.deleteGroup`, async (e) => {
        const list: any[] = util.getList();
        let group: any = null;
        let children = [];

        // tree view
        if (e) {
            group = e.group;
            children = e.children;
        }
        // cmnd panel
        else {
            group = await util.pickAGroup(util.getGroups(list));
            children = group ? list[util.getGroupIndexByName(group)].documents : [];
        }

        if (group) {
            const child = children.length;

            if (!child) {
                removeGroupAndChild(list, group);
            } else {
                window.showWarningMessage(
                    `File Shortcut: "${group} & children (${child} items)" will be removed as well, continue ?!`,
                    ...['Yes'],
                ).then(async (e) => {
                    if (e) {
                        if (group === util.defGroup) {
                            await util.updateConf('list', util.getListByType(list, 'object'));
                            util.showMsg(`"${group}" files are removed`);
                        } else {
                            removeGroupAndChild(list, group);
                        }
                    }
                });
            }
        }
    });
}

export function renameGroup() {
    return commands.registerCommand(`${util.CMND_NAME}.renameGroup`, async (e) => {
        const { group } = e;
        const list: any[] = util.getList();
        const groupsList = util.getGroups(list);
        const name = await util.newGroupName(groupsList, group);

        if (name) {
            const groupIndex = util.getGroupIndexByName(group);
            list[groupIndex].name = name;

            await util.updateConf('list', list);
        }
    });
}

export function changeFileGroup() {
    return commands.registerCommand(`${util.CMND_NAME}.changeFileGroup`, async (e) => {
        const list: any[] = util.getList();
        const toGroup = await util.selectOrCreateGroup(list);

        const { doc, group } = e;

        if (!toGroup) {
            return;
        }

        if (toGroup === group) {
            return util.showMsg('can\'t move to the same group');
        }

        // remove from current group
        if (group === util.defGroup) {
            list.splice(list.indexOf(doc), 1);
        } else {
            const groupIndex = util.getGroupIndexByName(group);
            const di = list[groupIndex].documents.indexOf(doc);

            list[groupIndex].documents.splice(di, 1);
        }

        // add to new group
        if (toGroup === util.defGroup) {
            list.push(doc);
        } else {
            const groupIndex = util.getGroupIndexByName(toGroup);

            if (groupIndex > -1) {
                list[groupIndex].documents.push(doc);
            } else {
                list.unshift({
                    name: toGroup,
                    documents: [doc],
                });
            }
        }

        await util.updateConf('list', list);
        util.showMsg(`"${util.getDocLabel(doc)}" moved from "${group}" to "${toGroup}"`, false);
    });
}

function removeGroupAndChild(list, group) {
    if (group == util.defGroup) {
        return util.showMsg(`default group "${group}" cant be removed`);
    }

    list.splice(util.getGroupIndexByName(group), 1);
    util.updateConf('list', list);
    util.showMsg(`group "${group}" removed`, false);
}

// Tree
export function sortTreeList() {
    return commands.registerCommand(`${util.CMND_NAME}.sort`, (e) => {
        const sortType = util.getConf('sort') === 'length' ? 'alpha' : 'length';

        return util.updateConf('sort', sortType);
    });
}

export function treeFileNameDisplay() {
    return commands.registerCommand(`${util.CMND_NAME}.DisplayFileNameInListAs`, (e) => {
        const displayType = util.getConf('DisplayFileNameInListAs') === util.SHOW_FILE_NAME_IN_LIST_AS.nameAndAlias
            ? util.SHOW_FILE_NAME_IN_LIST_AS.aliasOnly
            : util.SHOW_FILE_NAME_IN_LIST_AS.nameAndAlias;

        return util.updateConf('DisplayFileNameInListAs', displayType);
    });
}

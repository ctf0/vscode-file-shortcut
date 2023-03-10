import {window, workspace} from 'vscode';

/* Config ------------------------------------------------------------------- */
export function getConf(key: string) {
    return workspace.getConfiguration('fileShortcut')[key];
}

export function updateConf(key: string, val: any) {
    return workspace.getConfiguration().update(`fileShortcut.${key}`, val, true);
}

/* Document ----------------------------------------------------------------- */
export function getFileName(path: string) {
    return path.split('/').pop();
}

export async function showDocument(path, preserveFocus = true) {
    try {
        const activeColumn = window.activeTextEditor?.viewColumn || 1;
        const document = await workspace.openTextDocument(path);

        return window.showTextDocument(document, {
            viewColumn    : getConf('OpenInNewGroup') ? -2 : activeColumn,
            preview       : preserveFocus,
            preserveFocus : preserveFocus,
        });
    } catch (error) {
        showMsg(`file not found "${path}".`);
    }
}

/* Groups ------------------------------------------------------------------- */
export let defGroup = '♣';

export function setUnGroupedListName() {
    defGroup = getConf('unGroupedListName');
}

export function getListByType(list, type) {
    return list.filter((e) => typeof e == type);
}

export function getGroups(list) {
    return list.map((e) => e.name).filter((e) => e).concat([defGroup]);
}

export function getGroupIndexByName(group) {
    return getConf('list').findIndex((item) => item.name == group);
}

export async function selectOrCreateGroup(list) {
    const newGroup = 'create new group ...';
    const groupsList = getGroups(list).concat([newGroup]);
    const selection = await pickAGroup(groupsList);

    if (selection) {
        if (selection == newGroup) {
            const name = await newGroupName(groupsList);

            return name;
        }

        return selection;
    }

    return null;
}

export function newGroupName(list, val = '') {
    return window.showInputBox({
        placeHolder : 'enter a new group name ...',
        value       : val,
        validateInput(v) {
            if (!v) {
                return 'you have to add a name';
            } else if (v && list.includes(v)) {
                return `"${v}" is already taken, try something else`;
            } else {
                return '';
            }
        },
    });
}

export async function pickAGroup(list) {
    return window.showQuickPick(
        list,
        {placeHolder: 'chose a group ...'},
    );
}

export function getList() {
    return getConf('list');
}

/* Other -------------------------------------------------------------------- */
export async function showMsg(txt, error = true) {
    error
        ? window.showErrorMessage(`File Shortcut: ${txt}`)
        : window.showInformationMessage(`File Shortcut: ${txt}`);
}

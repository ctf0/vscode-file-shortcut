import fs from 'node:fs';
import { FileRenameEvent, TextEditor, commands, window, workspace } from 'vscode';
import * as cmnds from './commands';
import { getFilePaths } from './commands/showFileList';
import TreeProvider from './treeProvider';
import * as util from './utils';

export function activate({ subscriptions }) {
    setContext(false);
    checkForListLength();

    util.setUnGroupedListName();

    // on config change
    subscriptions.push(
        workspace.onDidChangeConfiguration((e: any) => {
            if (e.affectsConfiguration('fileShortcut')) {
                util.setUnGroupedListName();
                checkForListLength();
            }
        }),
    );

    // current file
    const editor = window.activeTextEditor;

    if (editor && isAFile(editor)) {
        setContext(true);
    }

    // on new document
    subscriptions.push(
        window.onDidChangeActiveTextEditor(async (editor: TextEditor | undefined) => {
            setContext(false);

            if (editor && isAFile(editor)) {
                setContext(true);
            }
        }),
    );

    subscriptions.push(
        cmnds.openFile(),
        cmnds.addCurrentFile(),
        cmnds.deleteFile(),
        cmnds.showFileList(),
        cmnds.sortTreeList(),
        cmnds.deleteGroup(),
        cmnds.renameGroup(),
        cmnds.changeFileGroup(),
        window.registerTreeDataProvider('fs_list', new TreeProvider()),
        workspace.onDidRenameFiles(async (event: FileRenameEvent) => await updateSavedPath(event)),
    );
}

async function updateSavedPath(event: FileRenameEvent) {
    const files = event.files;
    const filePaths: string[] = getFilePaths();

    for (const file of files) {
        const from = file.oldUri.fsPath;
        const to = file.newUri.fsPath;
        const _scheme = await fs.promises.stat(to);

        try {
            if (_scheme.isDirectory()) {
                continue;
            }

            if (!filePaths.includes(from)) {
                continue;
            }

            // update file path
            const list: any[] = util.getList();
            let found: any = null;

            for (let i = 0; i < list.length; i++) {
                const current = list[i];
                const type = typeof current;

                if (
                    (type == 'string' && current == from) ||
                    (type == 'object' && current.documents.some((e) => e == from))
                ) {
                    found = {
                        index : i,
                        type  : type,
                    };
                    break;
                }
            }

            const i = found.index;

            if (found.type == 'object') {
                list[i].documents = list[i].documents.map((item) => {
                    if (item === from) {
                        return to;
                    }

                    return item;
                });
            } else {
                list[i] = to;
            }

            util.updateConf('list', list);
            util.showMsg('file updated', false);
        } catch (error) {
            // console.error(error)
            break;
        }
    }
}

function setContext(val, key = 'fscEnabled') {
    commands.executeCommand('setContext', key, val);
}

function isAFile({ document }) {
    return document.fileName.includes('/');
}

function checkForListLength() {
    setContext(false, 'fscHasFiles');

    if (util.getList().length) {
        setContext(true, 'fscHasFiles');
    }
}

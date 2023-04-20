import fs from 'node:fs';
import { FileRenameEvent, commands, window, workspace } from 'vscode';
import * as cmnds from './commands/index';
import { getFilePaths } from './commands/showFileList';
import TreeProvider from './treeProvider';
import * as util from './utils';

export async function activate({ subscriptions }) {
    await toggleFscEnabled();
    await toggleFscHasFiles();
    util.setUnGroupedListName();

    subscriptions.push(
        // on config change
        workspace.onDidChangeConfiguration(async (e: any) => {
            if (e.affectsConfiguration(util.CMND_NAME)) {
                util.setUnGroupedListName();
                await toggleFscHasFiles();
            }
        }),
        // on new document
        window.onDidChangeActiveTextEditor(async (e) => await toggleFscEnabled()),
        // list
        cmnds.showFileList(),
        // file
        cmnds.openFile(),
        cmnds.addCurrentFile(),
        cmnds.deleteFile(),
        cmnds.toggleFileAlias(),
        // group
        cmnds.deleteGroup(),
        cmnds.renameGroup(),
        cmnds.changeFileGroup(),
        // tree
        cmnds.sortTreeList(),
        cmnds.treeFileNameDisplay(),
        window.registerTreeDataProvider('fs_list', new TreeProvider()),
        // rename
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

            if (!filePaths.some((item) => item === from)) {
                continue;
            }

            // update file path
            const list: any[] = util.getList();
            let found: any;

            for (let i = 0; i < list.length; i++) {
                const current = list[i];
                const type = typeof current;

                if (
                    (type === 'string' && current === from) ||
                    (type === 'object' && current.documents.some((doc) => util.getDocPath(doc) === from))
                ) {
                    found = {
                        index : i,
                        type  : type,
                    };
                    break;
                }
            }

            const i = found.index;

            if (found.type === 'object') {
                list[i].documents = list[i].documents.map((doc) => {
                    const docPath = util.getDocPath(doc);

                    if (docPath === from) {
                        if (typeof doc === 'object') {
                            doc.filePath = to;
                        } else {
                            doc = to;
                        }
                    }

                    return doc;
                });
            } else {
                list[i] = to;
            }

            await util.updateConf('list', list);
            util.showMsg(`file "${util.getFileName(from)}" updated to "${util.getFileName(to)}"`, false);
        } catch (error) {
            // console.error(error)
            break;
        }
    }
}

function setContext(val, key = 'fscEnabled') {
    return commands.executeCommand('setContext', key, val);
}

async function toggleFscEnabled() {
    const editor = window.activeTextEditor;

    await setContext(false);

    if (editor && !editor.document.isUntitled) {
        await setContext(true);
    }
}

async function toggleFscHasFiles() {
    await setContext(false, 'fscHasFiles');

    if (util.getList().length) {
        return setContext(true, 'fscHasFiles');
    }
}

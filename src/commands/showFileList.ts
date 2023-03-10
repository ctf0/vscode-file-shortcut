import { commands, window } from 'vscode';
import * as util from '../utils';

export function getFilePaths() {
    const filePaths = [];
    const list: any[] = util.getList();

    for (let i = 0; i < list.length; i++) {
        const item = list[i];

        if (typeof item == 'string') {
            filePaths.push(item);
        } else {
            filePaths.push(...item.documents);
        }
    }

    return filePaths;
}

export function showFileList() {
    return commands.registerCommand('fileShortcut.showFileList', async () => {
        const filePaths = getFilePaths();

        if (!filePaths.length) {
            return util.showMsg('no list found');
        }

        // enable preview mode
        showQuickPick(filePaths);
    });
}

async function showQuickPick(filePaths: string[]) {
    await window.showQuickPick(filePaths, {
        placeHolder: 'Pick a file to open',
    }).then(async (selection) => {
        if (selection) {
            await openFile(selection);
        }
    });
}

async function openFile(filePath: string) {
    try {
        util.showDocument(filePath);
    } catch (error) {
        if (error.message.includes('cannot open file')) {
            util.showMsg(`"${filePath}" not found`);
        }
    }
}

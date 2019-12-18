import * as vscode from 'vscode'
import { getConf, getFileName } from './utils'

export default class TreeProvider implements vscode.TreeDataProvider<TreeFile> {

    private _onDidChangeTreeData: vscode.EventEmitter<TreeFile | undefined> = new vscode.EventEmitter<TreeFile | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TreeFile | undefined> = this._onDidChangeTreeData.event;

    constructor() {
        vscode.workspace.onDidChangeConfiguration((e: any) => {
            if (e.affectsConfiguration('fileShortcut.list')) {
                this._onDidChangeTreeData.fire();
            }
        })
    }

    public async getChildren(file?: TreeFile): Promise<TreeFile[]> {
        let files = await getConf('list')

        return files.map((path) => {
            let name = getFileName(path)

            return new TreeFile(path, name, {
                command: 'fileShortcut.openFile',
                title: "Execute",
                arguments: [path]
            });
        });
    }

    getTreeItem(file: TreeFile): vscode.TreeItem {
        return file;
    }
}

class TreeFile extends vscode.TreeItem {
    constructor(
        path: string,
        label: string,
        command?: vscode.Command
    ) {
        super(label);
        this.id = path;
        this.command = command;
        this.tooltip = `open file "${path}"`
        this.iconPath = vscode.ThemeIcon.File
    }
}

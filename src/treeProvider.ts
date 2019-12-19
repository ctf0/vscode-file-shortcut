import {TreeItem, TreeDataProvider, EventEmitter, workspace, Command, ThemeIcon} from 'vscode'
import {getConf, getFileName} from './utils'

export default class TreeProvider implements TreeDataProvider<TreeFile> {

    _onDidChangeTreeData = new EventEmitter()
    onDidChangeTreeData = this._onDidChangeTreeData.event

    constructor() {
        workspace.onDidChangeConfiguration((e: any) => {
            if (e.affectsConfiguration('fileShortcut.list')) {
                this._onDidChangeTreeData.fire()
            }
        })
    }

    async getChildren() {
        let files = await getConf('list')

        return files.map((path) => {
            let name = getFileName(path)

            return new TreeFile(path, name, {
                command: 'fileShortcut.openFile',
                title: 'Execute',
                arguments: [path]
            })
        })
    }

    getTreeItem(file) {
        return file
    }
}

class TreeFile extends TreeItem {
    constructor(
        path,
        label,
        command?: Command
    ) {
        super(label)
        this.id = path
        this.command = command
        this.tooltip = `open file "${path}"`
        this.iconPath = ThemeIcon.File
    }
}

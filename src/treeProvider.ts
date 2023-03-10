import {
    EventEmitter,
    ThemeIcon,
    TreeItem,
    TreeItemCollapsibleState,
    workspace,
} from 'vscode';
import * as util from './utils';

export default class TreeProvider {

    _onDidChangeTreeData = new EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor() {
        workspace.onDidChangeConfiguration((e: any) => {
            if (e.affectsConfiguration('fileShortcut')) {
                setTimeout(() => {
                    this._onDidChangeTreeData.fire(undefined);
                }, 100);
            }
        });
    }

    async getList() {
        let list: any[] = util.getList();
        list = util.getListByType(list, 'object')
            .concat([{ name: util.defGroup, documents: list.filter((e) => typeof e == 'string') }]);

        return this.sortList(list)
            .map(({ name: group, documents: docs }) => new TreeGroup(
                group,
                `${group} (${docs.length} items)`,
                docs.map((path) => new TreeGroupItem(
                    group,
                    path,
                    util.getFileName(path),
                    {
                        command   : 'fileShortcut.openFile',
                        title     : 'Execute',
                        arguments : [path, 'treeview'],
                    },
                )),
            ));
    }

    sortList(list) {
        return list.map((item) => {
            if (util.getConf('sort') == 'alpha') {
                item.documents.sort((a, b) => {
                    const a_name = util.getFileName(a).toLowerCase();
                    const b_name = util.getFileName(b).toLowerCase();

                    if (a_name < b_name) {return -1;}

                    if (a_name > b_name) {return 1;}

                    return 0;
                });
            } else {
                item.documents.sort((a, b) => {
                    const a_name = util.getFileName(a);
                    const b_name = util.getFileName(b);

                    return a_name.length - b_name.length || a_name.localeCompare(b_name);
                });
            }

            return item;
        });
    }

    async getChildren(element) {
        if (element === undefined) {
            return this.getList();
        }

        return element.children;
    }

    getTreeItem(file) {
        return file;
    }
}

class TreeGroup extends TreeItem {
    children;
    group;

    constructor(
        group,
        label,
        children,
    ) {
        super(
            label,
            children === undefined
                ? TreeItemCollapsibleState.None
                : TreeItemCollapsibleState.Expanded,
        );

        this.group = group;
        this.children = children;
        this.contextValue = 'parent';
    }
}

class TreeGroupItem extends TreeItem {
    group;
    path;

    constructor(
        group,
        path,
        label,
        command,
    ) {
        super(label);

        this.group = group;
        this.path = path;
        this.command = command;
        this.tooltip = `open file "${path}"`;
        this.iconPath = ThemeIcon.File;
        this.contextValue = 'child';
    }
}

import {
    EventEmitter,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
    workspace,
} from 'vscode';
import * as util from './utils';

export default class TreeProvider implements TreeDataProvider<any> {
    _onDidChangeTreeData = new EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor() {
        workspace.onDidChangeConfiguration((e: any) => {
            if (e.affectsConfiguration(util.CMND_NAME)) {
                setTimeout(() => {
                    this._onDidChangeTreeData.fire(undefined);
                }, 300);
            }
        });
    }

    async getList() {
        const labelType = util.getConf('DisplayFileNameInListAs');
        let list: any[] = util.getList();
        list = util.getListByType(list, 'object')
            .concat([{
                name      : util.defGroup,
                documents : list.filter((e) => typeof e === 'string') || [],
            }]);

        return this.sortList(list)
            .map(({ name: group, documents }) => new TreeGroup(
                group,
                `${group} (${documents.length} items)`,
                documents.map((doc) => new TreeGroupItem(
                    group,
                    doc,
                    labelType,
                    util.getDocLabel(
                        doc,
                        labelType === util.SHOW_FILE_NAME_IN_LIST_AS.nameAndAlias,
                        labelType === util.SHOW_FILE_NAME_IN_LIST_AS.aliasOnly,
                    ),
                    {
                        command   : `${util.CMND_NAME}.openFile`,
                        title     : 'Execute',
                        arguments : [doc, 'treeview'],
                    },
                )),
            ));
    }

    sortList(list) {
        return list.map((item) => {
            if (util.getConf('sort') === 'alpha') {
                item.documents.sort((a, b) => {
                    a = util.getDocPath(a);
                    b = util.getDocPath(b);

                    const a_name = util.getFileName(a).toLowerCase();
                    const b_name = util.getFileName(b).toLowerCase();

                    if (a_name < b_name) {return -1;}

                    if (a_name > b_name) {return 1;}

                    return 0;
                });
            } else {
                item.documents.sort((a, b) => {
                    a = util.getDocPath(a);
                    b = util.getDocPath(b);

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
        this.contextValue = group === util.defGroup ? 'default' : 'parent';
    }
}

class TreeGroupItem extends TreeItem {
    group;
    doc;
    labelType;

    constructor(
        group,
        doc,
        labelType,
        label,
        command,
    ) {
        super(label);

        this.group = group;
        this.doc = doc;
        this.command = command;
        this.tooltip = `open file "${util.getDocPath(doc)}"`;
        this.iconPath = (doc.alias && labelType === util.SHOW_FILE_NAME_IN_LIST_AS.aliasOnly) ? new ThemeIcon('link') : ThemeIcon.File;
        this.resourceUri = Uri.file(util.getDocPath(doc));
        this.contextValue = group === util.defGroup ? 'default' : 'child';
    }
}

import {QuickPickItem, commands, window} from 'vscode'
import * as util from '../utils'

export function getFilePaths() {
    const filePaths: string[] = []
    const list: any[] = util.getList()

    for (let i = 0; i < list.length; i++) {
        const item = list[i]

        if (typeof item === 'string') {
            filePaths.push(item)
        } else {
            filePaths.push(...item.documents.map((doc: string | object) => util.getDocPath(doc)))
        }
    }

    return filePaths
}

export function showFileList() {
    return commands.registerCommand(`${util.CMND_NAME}.showFileList`, async() => {
        const filePaths: string[] = []
        const list: any[] = util.getList()

        for (let i = 0; i < list.length; i++) {
            const item = list[i]

            if (typeof item === 'string') {
                filePaths.push(item)
            } else {
                filePaths.push(...item.documents)
            }
        }

        if (!filePaths.length) {
            return util.showMsg('no list found')
        }

        showQuickPick(filePaths)
    })
}

async function showQuickPick(filePaths) {
    const items: QuickPickItem[] = filePaths.map((doc) => ({
        label: util.getDocLabel(doc),
        description: doc?.alias ? `(${doc.alias})` : '',
        detail: util.getDocPath(doc),
    }))

    await window.showQuickPick(items, {
        placeHolder: 'Pick a file to open',
        matchOnDescription: true,
        matchOnDetail: true,
        canPickMany: true,
    }).then(async(selections: any) => {
        if (selections) {
            for (const selection of selections) {
                await openFile(selection.detail)
            }
        }
    })
}

async function openFile(filePath: string) {
    try {
        await util.showDocument(filePath)
    } catch (error) {
        if (error.message.includes('cannot open file')) {
            util.showMsg(`"${filePath}" not found`)
        }
    }
}

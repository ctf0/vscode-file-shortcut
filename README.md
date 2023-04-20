# File Shortcut

based on https://github.com/ejabu/vscode-file-shortcut + extra options

## Features

- preview/open saved list
- add/delete file
- add/delete group
- move file from group to another
- sort list
- update file path on rename

### Example

```json
"fileShortcut.list": [
    {
        "name": "config",
        "documents": [
            "/path/to/abc.json",
            {
                "filePath": "/path/to/somefile.txt",
                "alias": "ideas"
            },
        ]
    },
]
```

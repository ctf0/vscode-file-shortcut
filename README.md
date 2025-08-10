# File Shortcut

based on https://github.com/ejabu/vscode-file-shortcut + extra options

## Features

- preview/open saved list
- add/delete file
- add/delete group
- move file from group to another
- add alias to file (group files only)
- sort list
- update file path on rename
- separate list for both workspace/global files

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
    "/path/to/somefile.txt",
    "/path/to/somefile.txt"
]
```

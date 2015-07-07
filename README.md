# Github Markdown Preview

> Preview Github markdown - as you type

The most exciting part in a project's lifetime is bragging about how awesome it
is, usually in it's __README__ file.  However, to get the wording and formatting
just right, one would need to write the file using Github's online editor,
switching back and forth between editing and previewing, loosing all the
efficiencies of using a copy of the vim text editor.

##### Features

* Preview rendered markdown as you type
* Output is rendered as if it was already on github
* Editor-friendly - Vim plugin included

##### Built with:

* [marked](https://www.npmjs.com/package/marked) for markdown rendering
* [highlight.js](https://highlightjs.org/) for syntax highlighting
* [express](https://www.npmjs.com/package/express) for the server
* [socket.io](https://www.npmjs.com/package/socket.io) for socket connections

## Getting started

The server is running on [node](http://nodejs.org/) and requires npm to install:

```sh
$ npm install -g gh-preview
```

To run the server manually, use the `gh-preview` command.
Note that the vim plugin will start the server automatically if it is not
already running at the given port.

```sh
$ Usage:
$ gh-preview --help | <port>
```

## Editor integration - VIM

Vim can be configured to 

#### Options

```vim
" Should the server start automatically when editing markdown files?
let g:ghp_start_server = 1

" The port to listen on / start `gh-preview` at
let g:ghp_port = 1234
```

#### Installation - Plugged.vim

```vim
Plug 'felixschl/gh-preview', { 'rtp': 'vim/' }
```

#### Installation - Vundle.vim

```vim
Plugin 'felixschl/gh-preview', { 'rtp': 'vim/' }
```

## Caveats

Github uses [pygments](http://pygments.org/) for their syntax highlighting,
whereas this project uses `highlight.js` - which, while awesome - is not
`pygments` and differences are bound to occur.

## Random wishlist

Since this a very purpose-driven project - that is to be able to interactively
preview markdown files before publishing to github - work on this project is not
focused and hence the following items, albeit relatively simple tasks, are
likely to remain wishes for the future to come.

* Show the caret in the output
* Synchronize scrolling
* Preview changes
* Theme for bitbucket projects
* Anchor tag support for permalinks in headings
* Implement `:GhPreviewOpenBrowser` command for vim
* Implement `:GhPreviewStart` command for vim
* Implement `:GhPreviewStop` command for vim
* Improve error reporting if the server goes away, etc.
* Use `forever` if installed

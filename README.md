# Github Markdown Preview

> Preview Github markdown - as you type

The most exciting part in a project's lifetime is bragging about how awesome it
is, usually in it's _Readme_ file.  However, to get the wording and formatting
just right, one would need to write the file using Github's online editor,
switching back and forth between editing and previewing, loosing all the
efficiencies of using a copy of the vim text editor.

**Features**:
* Preview rendered markdown as you type
* Output is rendered as if it was already on github
* [Editor-friendly (_not so much user-friendly_)](#test)

Uses [marked](https://www.npmjs.com/package/marked) for markdown rendering, and
[highlight.js](https://highlightjs.org/) for syntax highlighting. The server is
an [express](https://www.npmjs.com/package/express) app and accepts
[socket.io](https://www.npmjs.com/package/socket.io) socket connections.

## Getting started

The server is running on [node](http://nodejs.org/) which is a heavy dependency
to add, as I am aware. If you are still keen, download the node platform and
run:

```sh
$ npm install -g gh-preview
```

```sh
$ gh-preview --help

Usage: gh-preview <port>

Starts a `gh-preview` server at <port>.

`GET` the rendered output:
    Visit "http://localhost:<port>" in your browser

`POST` some markdown to "/input":
    POST /input { title: String, content: String }
```

## Editor integration - VIM

#### Installation - Plugged.vim

```vim
Plug 'felixschl/gh-preview', { rtp: 'vim/' }
```

#### Installation - Vundle.vim

```vim
Plugin 'felixschl/gh-preview', { rtp: 'vim/' }
```

#### Options

These optional settings go into your `.vimrc` if requried:

```vim
" Start automatically when editing markdown files. (Default: 1)
let g:ghPreview_autoStart=1

" Run server at the given port. (Default: 1234)
let g:ghPreview_port=1234
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

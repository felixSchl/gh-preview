# Github Markdown Preview

[![npm version](https://badge.fury.io/js/gh-preview.svg)](http://badge.fury.io/js/gh-preview)

> Preview Github markdown - as you type

![preview](https://raw.githubusercontent.com/felixSchl/felixSchl.github.io/master/gh-preview/preview.gif)

The most exciting part in a project's lifetime is bragging about how awesome it
is, usually in it's __README__ file.  However, to get the wording and formatting
just right, one would need to write the file using Github's online editor,
switching back and forth between editing and previewing, loosing all the
efficiencies of using a copy of the vim text editor.

## Features

* Preview rendered markdown as you type
* Output is rendered as if it was already on github
* Editor-friendly - Vim plugin included

## Getting started

The server is running on [node](http://nodejs.org/) and requires npm to install:

```sh
$ npm install -g gh-preview
```

To run the server manually, use the `gh-preview` command.
Note that the vim plugin will start the server automatically if it is not
already running at the given port.

```docopt
Usage:
  gh-preview [--port=<port>]

Options:
  -p, --port=<port>  The port to bind to [Default: 1234]
```

## Editor support

* [Vim integration](https://github.com/felixSchl/vim-gh-preview)


## What's new?

##### version 0.2.2

* Add scroll synchronization between vim and preview, inspired by
  [Ghost](https://ghost.org/).

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
* Anchor tag support for permalinks in headings
* Implement `:GhPreviewOpenBrowser` command for vim
* Implement `:GhPreviewStart` command for vim
* Implement `:GhPreviewStop` command for vim
* Improve error reporting if the server goes away, etc.
* Use `forever` if installed

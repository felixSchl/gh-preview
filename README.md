# gh-preview

> Preview Github markdown - as you type

## Getting started

``` sh
$ npm install gh-preview
```

``` sh
$ gh-preview --help

Usage: gh-preview <port>

Starts a `gh-preview` server at <port>.

`GET` the rendered output:
    Visit "http://localhost:<port>" in your browser

`POST` some markdown to "/input":
    POST /input { title: String, content: String }
```

## Editor integration

Of course, performing manual `POST` requests is not insanely productive, however
it does lend itself very well to integrating with an editor. This can be done in
one of two ways:

* **http** - Have your editor `POST` it's current textual content to the
  server's endpoint.
* **websockets** - Have your editor connect via sockets, using the `socket.io`
  protocol and emit `'data'`.

Using websockets could potentially enable a bi-directional communication between
the editor and the preview, but nothing of that sort has been implemented yet
(and likely never will be), so simply `POST`-ing should be a lot easier.

## Wishlist

* Show the caret in the output - This requires source-mapping from unrendered
  markdown to the rendered html
* Synchronize scrolling

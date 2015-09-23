import React from 'react';
import _ from 'lodash';
import Rx from 'rxjs';
import Promise from 'bluebird';
import MarkdownIt from 'markdown-it';
import Emoj from 'markdown-it-emoj';
import Checkbox from 'markdown-it-checkbox';
import Anchors from 'markdown-it-anchor';
import Highlight from 'highlightjs';
import IO from 'socket.io';
import { scrollToY } from './animate';
import { Preview } from './components';
import { ConnectionStatus } from './constants';

/*
 * Set up markdown renderer.
 */
const md = MarkdownIt({
  highlight: function (str, lang) {
    if (lang && Highlight.getLanguage(lang)) {
      try {
        return Highlight.highlight(lang, str).value;
      } catch (err) { /* ... */ }
    }
    return str;
  }
, html: true
, linkify: true
, typographer: false
, tables: true
});

/*
 * Enable emoji
 */
md.use(Emoj);

/*
 * Enable task lists
 */
md.use(Checkbox);

/*
 * Enable anchors
 */
md.use(Anchors, { permalink: true
                , permalinkClass: 'anchor'
                , permalinkSymbol: '<span class="octicon octicon-link"></span>'
                , permalinkBefore: true });

/*
 * A stream of `Document`s.
 */
const socket = IO(window.location.href, { forceNew: true })
  , onStatusChanged = Rx.Observable
    .merge(
      _.map(
        [ ['connect',         ConnectionStatus.CONNECTED]
        , ['error',           ConnectionStatus.DISCONNECTED]
        , ['disconnect',      ConnectionStatus.DISCONNECTED]
        , ['reconnect',       ConnectionStatus.DISCONNECTED]
        , ['reconnect_error', ConnectionStatus.DISCONNECTED]
        , ['reconned_failed', ConnectionStatus.DISCONNECTED] ]
      , ([e, s]) => Rx.Observable.fromEvent(socket, e).map(_.constant(s))))
    .distinctUntilChanged()
  , onSourceChanged = Rx.Observable.fromEvent(socket, 'document')
  , onDocumentChanged = onSourceChanged
      .filter(doc => doc.markdown)
      .map(doc => ({
        title: doc.title
      , offset: ((1/(doc.lines || 1)) * doc.cursor)
      , markup: md.render(doc.markdown)
      }));

React.render(
  <Preview
    onStatusChanged={ onStatusChanged }
    onDocumentChanged={ onDocumentChanged } />
, document.getElementById('main')
);

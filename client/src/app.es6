'use strict'

import React from 'react'
import Rx from 'rxjs'
import Promise from 'bluebird'
import MarkdownIt from 'markdown-it'
import Emoj from 'markdown-it-emoj'
import Highlight from 'highlightjs'
import IO from 'socket.io'

/*
 * Set up markdown renderer.
 */
var md = MarkdownIt({
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
 * Render a markdown document.
 */
var render = (markdown) => {
  return Promise.resolve(md.render(markdown));
};

/*
 * A stream of `Document`s.
 */
var socket = IO(window.location.href, {
      forceNew: true
    , query: 'type=output' })
  , onSourceChanged = Rx.Observable.fromEvent(socket, 'data')
  , onDocumentChanged = onSourceChanged
      .flatMapLatest(({ markdown, title }) => {
        return Rx.Observable.fromPromise(render(markdown))
            .map((markup) => { return {
                title: title
              , markup: markup
            }})
      });

/*
 * The <Preview/> component renders
 * a bit of markdown.
 */
class Preview extends React.Component {

  constructor (props) {
    super(props);

    props.onDocumentChanged.subscribe(({ markup, title }) => {
        this.setState(() => {
          return {
              title: title
            , markup: markup
          };
        });
    });

    this.state = {
      title: 'README.md'
    , markup: 'connecting...'
    };
  }

  render () {
    return (
      <div>
        <div id='readme'
          className='boxed-group flush clearfix announce instapaper_body md'>
          <h3>
            <span className='octicon octicon-book'></span>
            <span className='title'>{ this.state.title }</span>
          </h3>
          <article id='content'
            className='markdown-body entry-content'>
            <div dangerouslySetInnerHTML={{ __html: this.state.markup }}/>
          </article>
        </div>
      </div>
    );
  }
};

React.render(
  <Preview onDocumentChanged={ onDocumentChanged }/>
, document.getElementById('main')
);

'use strict'

import React from 'react'
import Rx from 'rxjs'
import Promise from 'bluebird'
import MarkdownIt from 'markdown-it'
import Emoj from 'markdown-it-emoj'
import Checkbox from 'markdown-it-checkbox'
import Highlight from 'highlightjs'
import IO from 'socket.io'
import { scrollToY } from './animate'

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
 * Render a markdown document.
 */
const render = markdown => Promise.resolve(md.render(markdown));

/*
 * A stream of `Document`s.
 */
const socket = IO(window.location.href, {
      forceNew: true
    , query: 'type=output' })
  , onSourceChanged = Rx.Observable.fromEvent(socket, 'data')
  , onDocumentChanged = onSourceChanged
      .flatMapLatest((doc) =>
        ((!doc.markdown)
          ? Rx.Observable.empty()
          : Rx.Observable.fromPromise(render(doc.markdown))
            .map((markup) => ({
              title: doc.title
            , offset: ((1/(doc.lines || 1)) * doc.cursor)
            , markup: markup
            }))));

/*
 * The <Preview/> component renders
 * a bit of markdown.
 */
class Preview extends React.Component {

  constructor (props) {
    super(props);

    // Propagate document changes to the UI
    props.onDocumentChanged.subscribe(({ markup, title, offset }) => {
      this.setState(() => {
        const height = React.findDOMNode(this.refs.wrapper).offsetHeight
            , position = height * offset;
        return {
          title: title
        , markup: markup
        , position: position };
      });
    });

    this.state = {
      title: 'README.md'
    , markup: 'connecting...'
    , position: 0 };
  }

  componentDidUpdate () {
    scrollToY(this.state.position, 2000, 'linear');
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
            ref={'wrapper'}
            className='markdown-body entry-content'
            style={{ position: 'relative' }}>
            <div dangerouslySetInnerHTML={{ __html: this.state.markup }}/>
            <div
              style={{ position: 'absolute', top: this.state.position }}>
            </div>
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

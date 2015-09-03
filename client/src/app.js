'use strict'

import React from 'react';
import _ from 'lodash';
import Rx from 'rxjs';
import Promise from 'bluebird';
import MarkdownIt from 'markdown-it';
import Emoj from 'markdown-it-emoj';
import Checkbox from 'markdown-it-checkbox';
import Highlight from 'highlightjs';
import IO from 'socket.io';
import { scrollToY } from './animate';

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
const socket = IO(window.location.href, { forceNew: true })
  , onSourceChanged = Rx.Observable.fromEvent(socket, 'document')
  , onDocumentChanged = onSourceChanged
      .flatMapLatest(doc =>
        ((!doc.markdown)
          ? Rx.Observable.empty()
          : Rx.Observable.fromPromise(render(doc.markdown))
            .map((markup) => ({
              title: doc.title
            , offset: ((1/(doc.lines || 1)) * doc.cursor)
            , markup: markup
            }))));

/**
 * The <Preview/> component renders a list of documents
 */
class Preview extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      documents: {}
    };

    /**
     * Book-keep documents and route their pub/subs
     */
    props.onDocumentChanged.subscribe(doc => {
      this.setState(state => {
        if (_.has(state.documents, doc.file)) {
          _.assign(state.documents[doc.file], doc);
        } else {
          state.documents[doc.file] = doc;
        }
        return state;
      });
    });
  }

  render() {
    return (
    <ul>
    { _.map(this.state.documents, doc =>
        <li>
          <DocumentPreview
            onDocumentChanged={ this.props.onDocumentChanged
              .where(update => update.file === doc.file)
            }/>
        </li>
    ) }
    </ul>);
  }
}

/**
 * The <DocumentPreview/> component renders a single document.
 */
class DocumentPreview extends React.Component {

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
    if (!this.state.locked) {
      scrollToY(this.state.position, 2000, 'linear');
    }
  }

  toggleLock () {
    console.log('TODO: implement locking');
  }

  render () {
    return (
      <div>
        <form action="#">
          <button type="submit" on-click={ this.toggleLock }>
            Lock scroll
          </button>
        </form>
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

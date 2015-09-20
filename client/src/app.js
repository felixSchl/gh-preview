'use strict'

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
              .map(markup => ({
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
    , activeDocument: null
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
        state.activeDocument = doc;
        return state;
      });
    });
  }

  render() {
    return (
    <div>
      { (this.state.activeDocument)
          ? <DocumentPreview document={ this.state.activeDocument }/>
          : <div id='connecting'>Connecting...</div>
      }
    </div>
    );
  }
}

/**
 * The <DocumentPreview/> component renders a single document.
 */
class DocumentPreview extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      locked: false
    };
  }

  componentDidMount () {
    this.updateScroll();
  }

  componentDidUpdate () {
    this.updateScroll();
  }

  updateScroll () {
    if (!this.state.locked) {
      const position =
        React.findDOMNode(this.refs.wrapper).offsetHeight
          * this.props.document.offset;
      scrollToY(position, 2000, 'linear');
    }
  }

  render () {
    const document = this.props.document;
    return (
      <div>
        <div id='readme'
          className='boxed-group flush clearfix announce instapaper_body md'>
          <h3>
            <span className='octicon octicon-book'></span>
            <span className='title'>{ document.title }</span>
          </h3>
          <article id='content'
            ref={'wrapper'}
            className='markdown-body entry-content'
            style={{ position: 'relative' }}>
            <div dangerouslySetInnerHTML={{ __html: document.markup }}/>
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

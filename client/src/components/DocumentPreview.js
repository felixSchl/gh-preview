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
import { scrollToY } from '../animate';

/**
 * The <DocumentPreview/> component renders a single document.
 */
export default class DocumentPreview extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      position: 0
    };
  }

  componentDidMount () {
    this.updateScroll();
  }

  componentDidUpdate () {
    this.updateScroll();
  }

  updateScroll () {
    if (!this.props.locked) {
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

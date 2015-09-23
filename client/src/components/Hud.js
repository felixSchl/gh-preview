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

/**
 * The <Hud/> component renders the heads-up-display
 */
export default class Hud extends React.Component {
  constructor (props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div id='hud'>
        <div id='scroll-locker'>
          <button onClick={ this.props.toggleLock }>
            { this.props.locked ? 'unlock scroll' : 'lock scroll' }
          </button>
        </div>
        <div
          id='status-indicator'
          className={ this.props.status }>
          <span className='title'>status:</span>
          <span className='indicator'>{ this.props.status }</span>
        </div>
      </div>
    );
  }
}


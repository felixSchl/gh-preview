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
import DocumentPreview from './DocumentPreview';
import Hud from './Hud';
import { ConnectionStatus } from '../constants';

/**
 * The <Preview/> component renders a list of documents
 */
export default class Preview extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      documents: {}
    , activeDocument: null
    , status: ConnectionStatus.CONNECTED
    , locked: false
    };

    props.onStatusChanged
      .subscribe(status => {
        this.setState(state => {
          state.status = status;
          return status;
        })
      });

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

  toggleLock () {
    this.setState(state => {
      state.locked = !state.locked;
      return state;
    });
  }

  render() {
    return (
    <div className={ 'preview ' + this.state.status }>
      <Hud
        toggleLock={ this.toggleLock.bind(this) }
        status={ this.state.status }
        locked={ this.state.locked } />
      { (this.state.activeDocument)
          ? <DocumentPreview
              document={ this.state.activeDocument }
              locked={ this.state.locked } />
          : <div id='connecting'>Connecting...</div>
      }
    </div>
    );
  }
}

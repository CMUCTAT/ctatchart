import $ from 'jquery';
window.$ = $;
import brd from './index.brd';

export { default as CTATChart } from '../src/CTATChart';
window.CTATTarget = 'Default';

$(() => {
  if (
    typeof CTATLMS.is.ToolsListener == 'function' &&
    CTATLMS.is.ToolsListener()
  ) {
    console.log('CTATLMS.is.ToolsListener()==true');

    var session = '' || CTATConfiguration.get('session_id');
    var port = '' || CTATConfiguration.get('remoteSocketPort');
    if (window.location.search) {
      var p = /[?&;]port=(\d+)/i.exec(window.location.search);
      if (p && p.length >= 2) {
        port = decodeURIComponent(p[1].replace(/\+/g, ' '));
      }
      var s = /[?&;]session=([^&]*)/i.exec(window.location.search);
      if (s && s.length >= 2) {
        session = decodeURIComponent(s[1].replace(/\+/g, ' '));
      }
    }
    CTATConfiguration.set('tutoring_service_communication', 'javascript');
    CTATConfiguration.set('user_guid', 'author');
    CTATConfiguration.set('session_id', session);
    CTATConfiguration.set('remoteSocketPort', port);
    CTATConfiguration.set('remoteSocketURL', '127.0.0.1');
  }

  //>-------------------------------------------------------------------------

  if (CTATLMS.is.Authoring() || CTATTarget === 'AUTHORING') {
    console.log('(CTATTarget=="AUTHORING")');

    var session = '' || CTATConfiguration.get('session_id');
    var port = '' || CTATConfiguration.get('remoteSocketPort');
    if (window.location.search) {
      var p = /[?&;]port=(\d+)/i.exec(window.location.search);
      if (p && p.length >= 2) {
        port = decodeURIComponent(p[1].replace(/\+/g, ' '));
      }
      var s = /[?&;]session=([^&]*)/i.exec(window.location.search);
      if (s && s.length >= 2) {
        session = decodeURIComponent(s[1].replace(/\+/g, ' '));
      }
    }
    CTATConfiguration.set('tutoring_service_communication', 'websocket');
    CTATConfiguration.set('user_guid', 'author');
    CTATConfiguration.set('question_file', '');
    CTATConfiguration.set('session_id', session);
    CTATConfiguration.set('remoteSocketPort', port);
    CTATConfiguration.set('remoteSocketURL', '127.0.0.1');
  }

  window.initTutor({
    question_file: brd,
    tutoring_service_communication: 'javascript',
  });
});

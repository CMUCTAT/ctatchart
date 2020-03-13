import $ from 'jquery';
window.$ = $;
import brd from './index.brd';

export { default as CTATChart } from '../CTATChart';
window.CTATTarget = 'Default';

$(() => {
  window.initTutor({question_file: brd,
                    tutoring_service_communication: 'javascript'});
});

(function ($) {
  $(document).ready(function ($) {
    var $send = $('#send');
    var $close = $('#close');
    var $tx = $('#tx');
    var $msg = $('#msg');
    var websocket = new Socket('ws://127.0.0.1:3000/socket');
    websocket.init(() => {
      console.log('connect open.');
    }, (event) => {
      if (event.data) {
        console.log(event);
        $tx.html($tx.html() + ''+event.data+'\n');
      }
    }, () => {
      console.log('connect close.');
    }, (err) => {
      console.log('connect err.', err.code ,err.message);
    });
    $send.on('click', function () {
      websocket.send(JSON.stringify($msg.val()));
    });
  });
})($);
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.ws('/socket', function(ws, req) {
  ws.on('message', function(msg) {
    console.log('message:' + msg);
    if (msg.toLowerCase().indexOf('heart') > -1) {
      ws.send('');
    } else {
      ws.send(msg);
    }
  });
});

module.exports = router;

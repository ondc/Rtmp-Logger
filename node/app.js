var express = require('express')
  , http = require('http')
  , path = require('path')
  , db = require('./models')
  , stream = require('./routes/stream')
  , client = require('./routes/client')
  , fakeAuth = require('./fakeAuth')
  , user = require('./auth_roles/connect_roles')

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.bodyParser());

app.configure('development', function(){
  app.use(express.errorHandler());
});



//SERVER API -- PRIVATE
app.post('/Person/:personid/Stream/:streamname',stream.createNew) //register new stream
app.get('/Stream/Start',stream.onStart) //start publish/play -- call with nginx on_*
app.get('/Stream/Done',stream.onDone) //stop publish/play -- call with nginx on_*
app.get('/Stream/Update',stream.onUpdate) //update stream -- call with stream_logger_rtmp or hls


//SERVER API -- PUBLIC

//stats for a particular stream
app.get('/Person/:personid/Stream/:streamname/Stats',
  fakeAuth.fakeAuth, user.can('access stats'),
  client.streamStats);

//stats for all times
app.get('/Person/:personid/Streams/Stats',
  fakeAuth.fakeAuth, user.can('access stats'),
  client.streamsStats);

//interval: {Day,Week,Month}
app.get('/Person/:personid/Streams/Stats/:interval',
  fakeAuth.fakeAuth, user.can('access stats'),
  client.streamsStats);



//INITIALIZE THE DB
db
  .sequelize
  .sync({ force: true })
  .complete(function(err) {
    if (err) {
      throw err
    } else {
      db.Server.findOrCreate({
        id: 13,
        ip: "127.0.0.1",
        status: 'new',
        provider: 'provider1',
        geo: [0.001,0.32222]
      })
      db.Server.findOrCreate({
        id: 16,
        ip: "192.168.10.6",
        status: 'new',
        provider: 'provider1',
        geo: [0.04,0.2]
      })
      db.Person.findOrCreate({
        username: 'topolino',
        password: '123456',
        email: 'topolino@paperopoli.it',
        plan: 'plan1',
        rank: 'user',
        lastlogin: "2011-11-05",
      })



      http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'))


      })
    }
  })

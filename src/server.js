const path = require( 'path' );
const http = require( 'http' );
const express = require( 'express' );
const socketio = require( 'socket.io' );
const {
  generateMessage,
  generateLocationMessage,
} = require( './utils/messages' );
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require( './utils/users' );

const app = express();
const server = http.createServer( app );
const io = socketio( server );

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join( __dirname, '../public' );

app.use( express.static( publicDirectoryPath ));

io.on( 'connection', ( socket ) => {
  const messages = {

  };

  socket.on( 'join', ( options, callback ) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if ( error ) {
      return callback( error );
    }

    messages.joined = `${ user.username } has joined the party!`;
    messages.welcome = `Welcome to the party, ${ user.username }!`;
    messages.left = `${ user.username } has left the party.`;
    socket.join( user.room );

    socket.emit( 'message', generateMessage( 'admin', messages.welcome ));
    socket.broadcast.to( user.room ).emit( 'message', generateMessage( 'admin', messages.joined ));

    io.to( user.room ).emit( 'roomData', {
      room: user.room,
      users: getUsersInRoom( user.room ),
    });
    return callback();
  });

  socket.on( 'sendMessage', ( sentMessage, callback ) => {
    const user = getUser( socket.id );
    io.to( user.room ).emit( 'message', generateMessage( user.username, sentMessage ));
    callback();
  });

  socket.on( 'sendLocation', ( location, callback ) => {
    const user = getUser( socket.id );
    io.to( user.room ).emit( 'locationMessage', generateLocationMessage( user.username, location ));
    callback();
  });

  socket.on( 'disconnect', () => {
    const user = removeUser( socket.id );

    if ( user ) {
      io.to( user.room ).emit( 'message', generateMessage( 'admin', messages.left ));
      io.to( user.room ).emit( 'roomData', {
        room: user.room,
        users: getUsersInRoom( user.room ),
      });
    }
  });
});

server.listen( port, () => {
  console.log( `Server is running on port ${ port }` );
});

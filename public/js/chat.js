const socket = io();

// Elements
const $messageForm = document.querySelector( '#message-form' );
const $messageFormInput = $messageForm.querySelector( '#message-box' );
const $messageFormButton = $messageForm.querySelector( '#message-submit' );
const $sendLocationButton = document.querySelector( '#send-location' );
const $messages = document.querySelector( '#messages' );
const $sidebar = document.querySelector( '#sidebar' );

// templates
const messageTemplate = document.querySelector( '#message-template' ).innerHTML;
const locationMessageTemplate = document.querySelector( '#location-message-template' ).innerHTML;
const sidebarTemplate = document.querySelector( '#sidebar-template' ).innerHTML;

// options
const { username, room } = Qs.parse( location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;

  // get height of newMessage
  const newMessageStyles = getComputedStyle( $newMessage );
  const newMessageMargin = parseInt( newMessageStyles.marginBottom, 10 );
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = $messages.offsetHeight;
  // height of messages container
  const containerHeight = $messages.scrollHeight;
  // how far are we scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;
  if ( containerHeight - newMessageHeight <= scrollOffset ) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on( 'message', ( message ) => {
  const html = Mustache.render( messageTemplate, {
    username: message.username,
    text: message.text,
    timestamp: moment( message.createdAt ).format( 'h:mm a' ),
  });
  $messages.insertAdjacentHTML( 'beforeend', html );
  autoscroll();
});

socket.on( 'locationMessage', ( locationMessage ) => {
  const html = Mustache.render( locationMessageTemplate, {
    username: locationMessage.username,
    url: locationMessage.url,
    timestamp: moment( locationMessage.createdAt ).format( 'h:mm a' ),
  });
  $messages.insertAdjacentHTML( 'beforeend', html );
  autoscroll();
});

socket.on( 'roomData', ( roomData ) => {
  const html = Mustache.render( sidebarTemplate, {
    room: roomData.room,
    users: roomData.users,
  });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener( 'submit', ( e ) => {
  e.preventDefault();

  $messageFormButton.setAttribute( 'disabled', 'disabled' );

  const message = $messageFormInput.value;
  socket.emit( 'sendMessage', message, ( error ) => {
    $messageFormButton.removeAttribute( 'disabled' );
    if ( error ) {
      console.log( error );
    }

    console.log( 'Message Delivered' );
  });
  $messageForm.reset();
  $messageFormInput.focus();
});

$sendLocationButton.addEventListener( 'click', () => {
  $sendLocationButton.setAttribute( 'disabled', 'disabled' );

  if ( !navigator.geolocation ) {
    const errorMessage = 'Geolocation is not supported by your browser';
    const errorSpan = document.createElement( 'span' );
    errorSpan.classList.add( 'error' );
    errorSpan.textContent = errorMessage;
    $sendLocationButton.insertAdjacentElement( 'afterend', errorSpan );
    return console.log( errorMessage );
  }

  navigator.geolocation.getCurrentPosition(( position ) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    socket.emit( 'sendLocation', location, () => {
      console.log( 'Location Shared!' );
      $sendLocationButton.removeAttribute( 'disabled' );
    });
  });
});

socket.emit( 'join', { username, room }, ( error ) => {
  if ( error ) {
    console.log( error );
    location.href = '/';
  }
});

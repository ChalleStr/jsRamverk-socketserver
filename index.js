const express = require('express');
const app = express();
const cors = require('cors');
const server = require("http").createServer(app);
const io = require('socket.io')(server, {
    cors: {
        //origin: "http://localhost:3000",
        origin: "https://charlottestrand.me:443",
        methods: ["GET", "POST"],
        credentials: true,
        //allowedHeaders: {"Access-Control-Allow-Origin": "http://localhost:3000"}
        allowedHeaders: {"Access-Control-Allow-Origin": "https://charlottestrand.me:443"}
    }
});

io.origins(["https://charlottestrand.me:443"])

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const router = require('./router');

app.use(cors());
app.use(router);

io.on('connect', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});

server.listen(process.env.PORT || 3001, () => console.log(`Server has started.`));
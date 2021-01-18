const express = require('express');
const app = express();
const cors = require('cors');
const server = require("http").createServer(app);
/**
 * NEDAN FUNGERAR LOKALT!
 */
// const io = require('socket.io')(server, {
//     cors: {
//         //origin: "http://localhost:3000",
//         origin: "https://charlottestrand.me:443",
//         methods: ["GET", "POST"],
//         credentials: true,
//         //allowedHeaders: {"Access-Control-Allow-Origin": "http://localhost:3000"}
//         allowedHeaders: {"Access-Control-Allow-Origin": "https://charlottestrand.me:443"}
//     }
// });

const io = require("socket.io")(server, {
    cors: {
        origin: "https://charlottestrand.me",
        methods: ["GET", "POST"],
        allowedHeaders: "Access-Control-Allow-Origin",
        credentials: true
    }
});

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const router = require('./router');

app.use(cors());
app.use(router);

// Middleware
app.use((req, res, next) => {
    next();
});


app.use("/", router);

app.use((req, res, next) => {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

app.use((req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        "errors": [
            {
                "status": err.status,
                "title": err.message,
                "detail": err.message
            }
        ]
    });
});

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

//server.listen(process.env.PORT || 8300, () => console.log(`Server listens at 8300.`));
server.listen(8300);

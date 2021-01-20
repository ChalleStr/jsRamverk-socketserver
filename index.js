const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
const server = require("http").createServer(app);
const router = require('./router');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

/**
 * NEDAN FUNGERAR LOKALT!
 */
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: {"Access-Control-Allow-Origin": "http://localhost:3000"}

    }
});
/**
 * Driftsatt läge.
 */
// const io = require("socket.io")(server, {
//     cors: {
//         origin: "https://charlottestrand.me",
//         methods: ["GET", "POST"],
//         allowedHeaders: ["Content-Type", "authorization", "Access-Control-Allow-Origin"],
//         credentials: true
//     }
// });


app.get("/", (req, res, next) => {
    res.json({msg: "This is CORS-enabled for all origins."})
});

io.on('connect', (socket) => {
    console.log("connected");
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

        io.to(user.room).emit('message', { user: user.name, text: message, });

        //if (callback) return callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        }
    });
});


server.listen(8300, () => {
    console.log("Server listening on 8300");
});

const express = require("express");
const app = express();
const cors = require("cors");
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: {"Access-Control-Allow-Origin": "http://localhost:3000"}
    }
});
// const session = require("express-session")({
//     secret: "my-secret",
//     resave: true,
//     saveUninitialized: true
// });
// const favicon = require("serve-favicon");

app.use(cors());

const people = {};
const sockmap = {};
const messageque = {};

//io.origins(['http://localhost:3001/']);

// Attach session
// app.use(session);
// app.use(favicon(__dirname+"favicon.ico"));

io.on("connection", (socket) => {
    console.info("connected");
    socket.on("join", (nick, room) => {
        console.log(nick, room);
        socket.join(room);
        if (!people.hasOwnProperty(room)) {
            people[room] = {};
        }

        people[room][socket.id] = {
            nick: nick,
            id: socket.id
        };
        sockmap[socket.id] = {
            nick: nick,
            room: room
        }
        if (messageque.hasOwnProperty(room)) {
            for (let i = 0; i < messageque[room].length; i++) {
                io.to(room).emit("message que", messageque[room][i].nick, messageque[room][i].msg);
            }
        }
        if (room == "") {
            socket.emit("update", "You have connected to the default room.");
        } else {
            socket.emit("update", `You have connected to room ${room}.`);
            socket.emit("people-list", people[room]);
            socket.to(room).broadcast.emit("add-person", nick, socket.id);
            console.log(nick);
            socket.to(room).broadcast.emit("update", `${nick} is online.`);
        }
    });

    socket.on("chat message", (msg, room) => {
        io.to(room).emit("chat message", people[room][socket.id].nick, msg);
        if (!messageque.hasOwnProperty(room)) {
            messageque[room] = []
        }
        messageque[room].push({
            nick : people[room][socket.id].nick,
            msg: msg
        })
        if (messageque[room].length > 50) {
            messageque[room].shift();
        }
    });

    socket.on("disconnect", () => {
        if (sockmap[socket.id]) {
            const room = sockmap[socket.id].room;
            socket.to(room).broadcast.emit("update", `${sockmap[socket.id].nick} has disconnected.`);
            io.emit("remove-person", socket.id);
            delete people[room][socket.id];
            delete sockmap[socket.id];
        }
    });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

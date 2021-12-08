const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const url = 'mongodb://localhost:27017/faza';
const postModel = require('./postModel');
const userModel = require('./userModel');
const messageModel = require('./messageModel');
const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());


mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});


function createPost(data) {
    return postModel.create(data);
};

function createUser(data) {
    return userModel.create(data);
}

app.get('/api', (req, res) => {
    res.status(200);
    res.send("Hello.");
});

app.get('/api/posts', (req, res) => {
    res.status(200);
    postModel.find((err, docs) => {
        if (err) return err;
        const userDocs = docs.map(doc => {
            return {userId: doc.user._id, userName: doc.user.name, body: doc.body, location: doc.location, date: doc.date}
        });
        console.log(userDocs);
        res.json(userDocs);
    });
});

app.post('/api/posts', verifyToken, (req, res) => {
    const user = req.user
    createPost({
        user: req.user,
        body: req.body.body,
        location: req.body.location
    }).then((post) => {
        res.status(201);
        res.json({
            message: "Created post successfully",
            user
        });
        console.log("Creation succesful.");
    }
    ).catch((err) => console.log(err));
});

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    const token = bearerHeader && bearerHeader.split(' ')[1];
    if (typeof token === undefined) return res.sendStatus(401);

    jwt.verify(token, 'someSecretKey', (err, user) => {
        if (err) {
            console.log('Could not verify token... ' + err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    })
}

app.post('/api/login', (req, res) => {
    if (req.body.name) {
        createUser({ name: req.body.name }).then((user) => {
            jwt.sign({ _id: user._id, name: user.name }, 'someSecretKey', (err, token) => {
                if (err) return err
                else {
                    user.loginToken = token;
                    user.save();
                    res.status(201).json({ token });
                }
            })

        })
    } else {
        res.sendStatus(404);
    }
})

server.listen(PORT, () => console.log(`Listening on ${PORT}...`));

/*
    Authentication middleware
*/
io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(socket.handshake.query.token, 'someSecretKey', (err, decoded) => {
        if (err) return next(new Error('Authentication Error'));
        socket.decoded = decoded;
        next();
      });
    } else {
        next(new Error('Authentication Error'));
    }    
  })

io.on('connection', (socket) => {
    console.log('a user connected.');
    userModel.findByIdAndUpdate(socket.decoded._id, {socketId: socket.id}, (err) => {
        if (err) {
            socket.disconnect(true);
            return err
        }
    })

    socket.on('disconnect', () => {
        console.log("a user disconnected.");
    })

    socket.on('private_message', ({userId, msg}) => {
        console.log("private_message action");
        userModel.findById(userId, (err, user) => {
            if (err) {
                io.to(socket.id).emit('error', 'could not find user specfied');
            } else {
            console.log(user.socketId)
            socket.to(user.socketId).emit('private_message', msg);
            messageModel.create({from: socket.decoded._id, to: user._id, body: msg}).catch((err) => {
                console.log(err);
            })
        }
        })
    })


})
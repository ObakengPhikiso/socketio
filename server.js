const app = require('express')();
const http = require('http').createServer(app);
const mongo = require('mongodb').MongoClient;
const client = require('socket.io')(http);

// Connect to mongo
mongo.connect('mongodb://stut-admin:Mighty.1872%40d12@cluster0-shard-00-00.gwcrf.mongodb.net:27017,cluster0-shard-00-01.gwcrf.mongodb.net:27017,cluster0-shard-00-02.gwcrf.mongodb.net:27017/stut?ssl=true&replicaSet=atlas-e0bxh9-shard-0&authSource=admin&retryWrites=true&w=majority', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');
    app.get('/', (req, res) => {
        res.send('<h1>Hey Socket.io</h1>');
    });
    http.listen(3000, () => {
    console.log('listening on *:3000');
    });

    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');
    console.log('a user connected');

        // On disconnect 
    socket.on('disconnect', () => {
    console.log('user disconnected');

    });
        // Create function to send status
        function sendStatus(s) {
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let message = data.message;
            let roomId = data.roomId;
            let userId = data.userId;
            // Check for name and message
            if(roomId == '' || message == '' || userId == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({userId: userId, roomId: roomId, message: message}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});

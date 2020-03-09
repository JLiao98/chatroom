const ws = require('nodejs-websocket');
var Cookies = require('cookies');


chatHistory = [];
nickName = [];


const boardcast = (str) => {
    console.log(str);
    server.connections.forEach((connect) => {
        connect.sendText(str)
    })
};

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function assignUsername() {
    var rString = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    return rString;
}



const getAllChatter = () => {
    let chartterArr = [];
    server.connections.forEach((connect) => {
        chartterArr.push({name: connect.nickname})
    });
    return chartterArr;
};

const server = ws.createServer((connect) => {


    connect.on('text', (str) => {
        let data = JSON.parse(str);
        console.log(data);
        switch (data.type) {
            case 'setName':

                let nname = assignUsername();

                connect.sendText(JSON.stringify({
                    type: 'setName',
                    message: nname
                }));

                nickName.push(nname);

                connect.nickname = nname;
                boardcast(JSON.stringify({
                    type: 'serverInformation',
                    message: nname + " enters the chat room",
                }));

                boardcast(JSON.stringify({
                    type: 'chatterList',
                    list: getAllChatter()
                }));

                chatHistory.forEach(function(item){
                  connect.sendText(item);
                });
                break;
            case 'chat':
                if (data.message.substr(0,6)==="/nick "){
                    newname = data.message.substr(6,data.message.length - 6);
                    console.log(newname);

                    let fflag = false;

                    nickName.forEach(function(item) {
                        console.log(item);
                        if (item === newname){
                            fflag = true;
                            connect.sendText(JSON.stringify({
                                type: 'serverInformation',
                                name: newname,
                                message: "Duplicated nickname!!"
                            }));
                        }
                    });

                    if (fflag === false){

                        nickName.forEach((item,index,arr) => {
                            if(item === connect.nickname){
                                arr.splice(index,1)
                            }
                        });

                        connect.sendText(JSON.stringify({
                            type: 'setName',
                            message: newname
                        }));

                        boardcast(JSON.stringify({
                            type: 'serverInformation',
                            name: newname,
                            message: connect.nickname + " has changed the username to " + newname
                        }));
                        connect.nickname = newname;
                        nickName.push(newname);

                        boardcast(JSON.stringify({
                            type: 'chatterList',
                            list: getAllChatter()
                        }));
                    }

                }else {
                    boardcast(JSON.stringify({
                        type: 'chat',
                        name: connect.nickname,
                        message: data.message
                    }));
                    chatHistory.push(JSON.stringify({
                        type: 'chat',
                        name: connect.nickname,
                        message: data.message
                    }));
                }

                break;
            default:
                break;
        }
    });


    connect.on('close', () => {

        boardcast(JSON.stringify({
            type: 'serverInformation',
            message: connect.nickname + ' leaves the chat room'
        }));

        nickName.forEach((item,index,arr) => {
            if(item === connect.nickname){
                arr.splice(index,1)
            }
        });


        boardcast(JSON.stringify({
            type: 'chatterList',
            list: getAllChatter()
        }))
    });


    connect.on('error', (err) => {
        console.log(err);
    })

}).listen(3000, () => {
    console.log("running")
});
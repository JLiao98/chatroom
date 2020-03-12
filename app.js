const ws = require('nodejs-websocket');


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

function getUserNameColor(userName) {
    const COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];
    // Compute hash code
    let hash = 7;
    for (let i = 0; i < userName.length; i++) {
        hash = userName.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    const index = Math.abs(hash % COLORS.length);
    return COLORS[index];
}

const getAllChatter = () => {
    let chartterArr = [];
    server.connections.forEach((connect) => {
        chartterArr.push({name: connect.nickname, clr: connect.clr})
    });
    return chartterArr;
};

const server = ws.createServer((connect) => {


    connect.on('text', (str) => {
        let data = JSON.parse(str);
        console.log(data);
        switch (data.type) {
            case 'cookieName':
                let cflag = false;
                nickName.forEach(function (item) {
                    if (item === data.name) {
                        cflag = true;
                    }
                });

                if (cflag === false) {
                    connect.sendText(JSON.stringify({
                        type: 'setName',
                        message: data.name,
                        clr: data.clr
                    }));

                    nickName.push(data.name);

                    connect.nickname = data.name;
                    connect.clr = data.clr;
                    boardcast(JSON.stringify({
                        type: 'serverInformation',
                        message: data.name + " enters the chat room",
                    }));

                    boardcast(JSON.stringify({
                        type: 'chatterList',
                        list: getAllChatter()
                    }));

                    chatHistory.forEach(function (item) {
                        connect.sendText(item);
                    });

                } else {
                    let nname = assignUsername();

                    connect.sendText(JSON.stringify({
                        type: 'setName',
                        message: nname,
                        clr: getUserNameColor(nname)
                    }));

                    nickName.push(nname);

                    connect.nickname = nname;
                    connect.clr = getUserNameColor(connect.nickname);
                    boardcast(JSON.stringify({
                        type: 'serverInformation',
                        message: nname + " enters the chat room",
                    }));

                    boardcast(JSON.stringify({
                        type: 'chatterList',
                        list: getAllChatter()
                    }));

                    chatHistory.forEach(function (item) {
                        connect.sendText(item);
                    });
                }

                break;
            case 'setName':
                let nname = assignUsername();

                connect.sendText(JSON.stringify({
                    type: 'setName',
                    message: nname,
                    clr: getUserNameColor(nname)
                }));

                nickName.push(nname);

                connect.nickname = nname;
                connect.clr = getUserNameColor(connect.nickname);
                boardcast(JSON.stringify({
                    type: 'serverInformation',
                    message: nname + " enters the chat room",
                }));

                boardcast(JSON.stringify({
                    type: 'chatterList',
                    list: getAllChatter()
                }));

                chatHistory.forEach(function (item) {
                    connect.sendText(item);
                });

                break;
            case '/nickcolor':
                connect.clr = data.clr;

                boardcast(JSON.stringify({
                    type: 'serverInformation',
                    message: connect.nickname + " change the color to" + connect.clr,
                }));

                boardcast(JSON.stringify({
                    type: 'chatterList',
                    list: getAllChatter()
                }));
                break;
            case 'chat':
                if (data.message.substr(0, 6) === "/nick ") {
                    newname = data.message.substr(6, data.message.length - 6);
                    console.log(newname);

                    let fflag = false;

                    nickName.forEach(function (item) {
                        console.log(item);
                        if (item === newname) {
                            fflag = true;
                            connect.sendText(JSON.stringify({
                                type: 'serverInformation',
                                message: "Duplicated nickname!!"
                            }));
                        }
                    });

                    if (fflag === false) {

                        nickName.forEach((item, index, arr) => {
                            if (item === connect.nickname) {
                                arr.splice(index, 1)
                            }
                        });

                        connect.sendText(JSON.stringify({
                            type: 'setName',
                            message: newname,
                            clr: getUserNameColor(newname)
                        }));

                        boardcast(JSON.stringify({
                            type: 'serverInformation',
                            message: connect.nickname + " has changed the username to " + newname
                        }));
                        connect.nickname = newname;
                        connect.clr = getUserNameColor(connect.nickname);
                        nickName.push(newname);

                        boardcast(JSON.stringify({
                            type: 'chatterList',
                            list: getAllChatter()
                        }));
                    }

                } else {
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

        nickName.forEach((item, index, arr) => {
            if (item === connect.nickname) {
                arr.splice(index, 1)
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
const logger = new NIL.Logger(`test`);
const path = require(`path`);
const { segment } = require(`oicq`);
const request = require(`sync-request`);

const xuid_api = `https://api.blackbe.xyz/openapi/v3/utils/xuid?gamertag=`;

const config = JSON.parse(NIL.IO.readFrom(path.join(__dirname, `config.json`)));
let server_name = config.server;
let server_name_2 = config.server_2;
let main_id = config.main_id;
let chat_id = config.chat_id;
let second_server = config.second_server;
let clean_entity_cmd = config.clean_entity_cmd;
let default_delay = config.default_delay;
let check_entity_cmd = config.check_entity_cmd;
let check_xbox_cmd = config.check_xbox_cmd;
let mute_cmd = config.mute_cmd;
let TPS_cmd = config.TPS_cmd;
let economy_cmd = config.economy_cmd;
let ban_cmd = config.ban_cmd;
let auto_agree_group = config.auto_agree_group;
let auto_agree_friend = config.auto_agree_friend;
let auto_allow_group = config.auto_allow_group;

const typelist = JSON.parse(NIL.IO.readFrom(path.join(__dirname, `typelist.json`)));

let server = NIL.SERVERS.get(server_name);
let server_2 = NIL.SERVERS.get(server_name_2);
let bot = NIL.bots.getBot(NIL._vanilla.cfg.self_id);
let server_status = 0;
let server_status_2 = 0;

const economy_regex = new RegExp(`(.+)Balance:(.+)`);
const tps_regex = new RegExp(`(.+)TPS:(.+)`);

var getAt = function (e) {
    var at = [];
    for (i in e.message) {
        switch (e.message[i].type) {
            case "at":
                at.push(e.message[i].qq);
                break;
        }
    }
    return at;
}

function getText(e) {
    var rt = '';
    for (i in e.message) {
        switch (e.message[i].type) {
            case "text":
                rt += e.message[i].text;
                break;
        }
    }
    return rt;
}

function GET_Request(gamertag){
    let obj = request(`GET`, xuid_api + gamertag);
    let result = JSON.parse(obj.getBody(`utf8`));
    if(result.status == 2000){
        return result
    }else if(result.status == 2001){
        let err = `???????????????????????????`;
        return err
    }else if(result.status == 4001){
        let err = `???????????????`;
        return err
    }else if(result.status == 5005){
        let err = `API????????????????????????????????????`;
        return err
    }else{
        let err = `????????????`;
        return err
    }
}

/*
function myIsNaN(value) {
    document.write((typeof value === 'number' && !isNaN(value))+"<br>");
}
*/

function myIsNaN(val){

    var regPos = /^[0-9]+.?[0-9]*/; //????????????????????????
  
    if(regPos.test(val) ){
        return true;
    }else{
        return false;
    }

}


var sleep = function(time) {
    var startTime = new Date().getTime() + parseInt(time, 10);
    while(new Date().getTime() < startTime) {}
};

class MagicUtility extends NIL.ModuleBase{
    onStart(api){
        logger.setTitle(`MagicUtility`);
        logger.info(`MagicUtility loaded!`);

        api.listen(`onRobotOnline`, (qq) => {

            /*
            ????????????????????????????????????????????????????????????
            */

            server.sendCMD(`list`, (callback) => {
                if(callback == null){
                    server_status = 0;
                }else{
                    server_status = 1;
                }
            });
            if(second_server == true){
                server_2.sendCMD(`list`, (callback) => {
                    if(callback == null){
                        server_status_2 = 0;
                    }else{
                        server_status_2 = 1;
                    }
                })
            }
        })

        api.listen(`onServerStart`, (callback) => {
            if(callback.server == server_name){
                server_status = 1;
            }
            if(callback.server == server_name_2){
                server_status_2 = 1;
            }
        })
        api.listen(`onServerStop`, (callback) => {
            if(callback.server == server_name){
                if(server_status == 0){
                    server.sendStart();
                }
            }
            if(callback.server == server_name_2){
                if(server_status_2 == 0){
                    server_2.sendStart();
                }
            }
        })
        api.listen(`onMainMessageReceived`, (e) => {
            let text = getText(e);
            let pt = text.split(` `);

            /*
            ?????????????????????
            */

            if(pt[0] == check_xbox_cmd){
                    switch(pt.length){
                        case 1:
                            if(NIL._vanilla.wl_exists(e.sender.qq) == true){
                                let xbox_id = NIL._vanilla.get_xboxid(e.sender.qq);
                                let result = GET_Request(xbox_id);
                                e.reply(`?????????????????????` + xbox_id + `\nXUID: ` + `${result.data.xuid}`, true);
                            }else{
                                e.reply(`?????????????????????`)
                            }
                            break
                        case 2:
                            var at = getAt(e);
                            at.forEach(element => {
                                if(NIL._vanilla.wl_exists(element) == true){
                                    let xbox_id = NIL._vanilla.get_xboxid(element);
                                    let result = GET_Request(xbox_id);
                                    e.reply(`???????????????????????????` + xbox_id + `\nXUID: ` + `${result.data.xuid}`, true);
                                }else{
                                    e.reply(`???????????????????????????`)
                                }
                            });
                            break
                        case 3: // ????????????
                            var at = getAt(e);
                            at.forEach(element => {
                                if(NIL._vanilla.wl_exists(element) == true){
                                    let xbox_id = NIL._vanilla.get_xboxid(element);
                                    let result = GET_Request(xbox_id);
                                    e.reply(`???????????????????????????` + xbox_id + `\nXUID: ` + `${result.data.xuid}`, true);
                                }else{
                                    e.reply(`???????????????????????????`)
                                }
                            });
                            break
                        default:
                            e.reply(`?????????` + check_xbox_cmd + ` <@?????????????????????>`);

                    }
            }

            /*
            ??????TPS??????
            */

            if(pt[0] == TPS_cmd){
                switch(pt.length){
                    case 1:
                        server.sendCMD(`tps`, (callback) => {
                            var res = callback.replace(tps_regex, server_name + `??????TPS???$2`);
                            if(callback  != null){
                                e.reply(res);
                            }else{
                                e.reply(server_name + `????????????`);
                            }
                        });
                        if(second_server == true){
                            server_2.sendCMD(`tps`, (callback) => {
                                var res = callback.replace(tps_regex, server_name_2 + `??????TPS???$2`);
                                if(callback != null){
                                    e.reply(res);
                                }else{
                                    e.reply(server_name_2 + `?????????!`);
                                }
                            })
                        }
                        break
                    case 2:
                        if(pt[1] == server_name){
                            server.sendCMD('tps', (callback) => {
                                var res = callback.replace(tps_regex, server_name + `??????TPS???$2`);
                                e.reply(res);
                            })
                        }
                        if(pt[1] == server_name_2){
                            server_2.sendCMD('tps', (callback) => {
                                var res = callback.replace(tps_regex, server_name_2 + `??????TPS???$2`);
                                e.reply(res);
                            })
                        }
                        break
                    default:
                        e.reply(`?????????` + TPS_cmd + ` <???????????????????????????>`)
                }
            }

            /*
            ??????????????????
            */

            if(pt[0] == economy_cmd){
                switch(pt.length){
                    case 1:
                        let qq = e.sender.qq;
                        let xbox_id = NIL._vanilla.get_xboxid(qq);
                        server.sendCMD(`money query ` + xbox_id, (callback) => {
                            let res = callback.replace(economy_regex, `??????` + xbox_id + `???` + server_name + `??????????????????$2`);
                            e.reply(res);
                        });
                        if(second_server == true){
                            server_2.sendCMD(`money query ` + xbox_id, (callback) => {
                                let res = callback.replace(economy_regex, `??????` + xbox_id + `???` + server_name_2 + `??????????????????$2`);
                                e.reply(res);
                            });
                        }
                        break
                    case 2:
                        var at = getAt(e);
                        at.forEach(element => {
                            if(NIL._vanilla.wl_exists(element) == true){
                                let xbox_id = NIL._vanilla.get_xboxid(element);
                                server.sendCMD(`money query ` + xbox_id, (callback) => {
                                    let res = callback.replace(economy_regex, `??????` + xbox_id + `???` + server_name + `??????????????????$2`);
                                    e.reply(res);
                                });
                                if(second_server == true){
                                    server_2.sendCMD(`money query ` + xbox_id, (callback) => {
                                        let res = callback.replace(economy_regex, `??????` + xbox_id + `???` + server_name_2 + `??????????????????$2`);
                                        e.reply(res);
                                    });
                                }
                            }else{
                                e.reply(`???????????????????????????`, true);
                            }
                        });
                        break
                    case 3:
                        var at = getAt(e);
                        at.forEach(element => {
                            if(NIL._vanilla.wl_exists(element) == true){
                                let xbox_id = NIL._vanilla.get_xboxid(element);
                                server.sendCMD(`money query ` + xbox_id, (callback) => {
                                    let res = callback.replace(economy_regex, `??????` + xbox_id + `???` + server_name + `??????????????????$2`);
                                    e.reply(res);
                                });
                                if(second_server == true){
                                    server_2.sendCMD(`money query ` + xbox_id, (callback) => {
                                        let res = callback.replace(economy_regex, `??????` + xbox_id + `???` + server_name_2 + `??????????????????$2`);
                                        e.reply(res);
                                    });
                                }
                            }else{
                                e.reply(`???????????????????????????`, true);
                            }
                        });
                        break
                    default:
                        e.reply(`?????????` + economy_cmd + ` <@?????????????????????>`);

                }
            }
            
            /*
            ??????????????????
            */

            if (pt[0] == check_entity_cmd){
                server.sendCMD(`entque`, (callback) => {
                    e.reply(callback);
                });
                if(second_server == true){
                    server_2.sendCMD(`entque`, (callback) => {
                        e.reply(callback);
                    });
                }
            }

            /*
            ???????????????
            */

            if(NIL._vanilla.isAdmin(e.sender.qq) == true){
                
                /*
                ????????????
                */

                if(pt[0] == `??????`){
                    switch(pt.length){
                        case 2:
                            if(pt[1] == server_name){
                                if(server_status == 1){
                                    server.sendStop();
                                    server_status = 0;
                                }else{
                                    e.reply(server_name + ` ?????????`);
                                }
                            }
                            if(pt[1] == server_name_2){
                                if(server_status_2 == 1){
                                    server_2.sendStop();
                                    server_status_2 = 0;
                                }else{
                                    e.reply(server_name_2 + ` ?????????`);
                                }
                            }
                            break
                        default:
                            e.reply(`??????????????? <???????????????>`)
                    }
                }

                /*
                ??????????????????
                */

                if(pt[0] == clean_entity_cmd){
                    switch(pt.length){
                        case 2:
                            let target = pt[1]; // ??????????????????
                            let target_id = typelist[target]; // ??????????????????

                            if(target_id != undefined){
                                server.sendCMD(`/say ??????` + default_delay/1000 + `????????????` + target, (callback) => {
                                    //
                                });
                                if(second_server == true){
                                    server_2.sendCMD(`/say ??????` + default_delay/1000 + `????????????` + target, (callback) => {
                                    //
                                    });
                                }
                                sleep(default_delay);
                                server.sendCMD(`/kill @e[type=` + target_id + `]`, (callback) => {
                                    //
                                });
                                if(second_server == true){
                                    server_2.sendCMD(`/kill @e[type=` + target_id + `]`, (callback) => {
                                        //
                                    });
                                }
                                e.reply(target + `???????????????`);
                                break
                            }else{
                                e.reply(`?????????????????????` + target);
                                break
                            }

                        case 3:
                            let delay = pt[2];
                            if(target_id != undefined){
                                server.sendCMD(`/say ??????` + delay + `????????????` + target, (callback) => {
                                    //
                                });
                                if(second_server == true){
                                    server_2.sendCMD(`/say ??????` + delay + `????????????` + target, (callback) => {
                                        //
                                    });
                                }
                                break
                            }else{
                                e.reply(`?????????` + clean_entity_cmd + ` <????????????> <??????????????????>`);
                                break
                            }
                        default:
                            e.reply(`?????????` + clean_entity_cmd + ` <????????????> <??????????????????>`);
                    }
                }

                /*
                ????????????
                */

                if(pt[0] == ban_cmd){
                    switch(pt.length){
                        case 2:
                            var at = getAt(e);
                            at.forEach(element => {
                                if(NIL._vanilla.wl_exists(element) == true){
                                    var xbox_id = NIL._vanilla.get_xboxid(element);
                                    server.sendCMD(`ban` + xbox_id, (callback) => {
                                        e.reply(callback);
                                    });
                                    if(second_server == true){
                                        server_2.sendCMD(`ban` + xbox_id, (callback) => {
                                            e.reply(callback);
                                        })
                                    }
                                }
                            });
                            break
                        default:
                            e.reply
                    }
                }
            }
        });


        /*
        oicq????????????
        */

        bot.on(`request.group.invite`, (e) => { // ????????????????????????
            if(auto_agree_group == true){
                e.approve();
            }
        });

        bot.on(`request.friend.add`, (e) => { // ????????????????????????
            if(auto_agree_friend == true){
                e.approve();
            }
        });

        bot.on(`request.group.add`, (e) => { // ???????????????
            if(auto_allow_group == true){
                e.approve();
            }
        })

    }
    onStop(api){

    }
}

module.exports = new MagicUtility
const logger = new NIL.Logger(`test`);
const { get } = require("http");
const path = require(`path`);
const { segment } = require(`oicq`);
const { verify } = require("crypto");
const { off } = require("process");

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

/*
function myIsNaN(value) {
    document.write((typeof value === 'number' && !isNaN(value))+"<br>");
}
*/

function myIsNaN(val){

    var regPos = /^[0-9]+.?[0-9]*/; //判断是否是数字。
  
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
            通过发送命令的回调函数检查服务器是否开启
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
            查询白名单部分
            */

            if(pt[0] == check_xbox_cmd){
                    switch(pt.length){
                        case 1:
                            if(NIL._vanilla.wl_exists(e.sender.qq) == true){
                                let xbox_id = NIL._vanilla.get_xboxid(e.sender.qq);
                                e.reply(`你的玩家代号为` + xbox_id, true);
                            }else{
                                e.reply(`你未绑定白名单`)
                            }
                        case 2:
                            var at = getAt(e);
                            at.forEach(element => {
                                if(NIL._vanilla.wl_exists(element) == true){
                                    let xbox_id = NIL._vanilla.get_xboxid(element);
                                    e.reply(`该群员的玩家代号为` + xbox_id, true);
                                }else{
                                    e.reply(`该群员未绑定白名单`)
                                }
                            });
                            break
                        default:
                            e.reply(`格式：` + check_xbox_cmd + ` <@群成员（可选）>`);

                    }
            }

            /*
            查询TPS部分
            */

            if(pt[0] == TPS_cmd){
                switch(pt.length){
                    case 1:
                        server.sendCMD(`tps`, (callback) => {
                            var res = callback.replace(tps_regex, server_name + `目前TPS：$2`);
                            if(callback  != null){
                                e.reply(res);
                            }else{
                                e.reply(server_name + `未开启！`);
                            }
                        });
                        if(second_server == true){
                            server_2.sendCMD(`tps`, (callback) => {
                                var res = callback.replace(tps_regex, server_name_2 + `目前TPS：$2`);
                                if(callback != null){
                                    e.reply(res);
                                }else{
                                    e.reply(server_name_2 + `未开启!`);
                                }
                            })
                        }
                        break
                    case 2:
                        if(pt[1] == server_name){
                            server.sendCMD('tps', (callback) => {
                                var res = callback.replace(tps_regex, server_name + `目前TPS：$2`);
                                e.reply(res);
                            })
                        }
                        if(pt[1] == server_name_2){
                            server_2.sendCMD('tps', (callback) => {
                                var res = callback.replace(tps_regex, server_name_2 + `目前TPS：$2`);
                                e.reply(res);
                            })
                        }
                        break
                    default:
                        e.reply(`格式：` + TPS_cmd + ` <服务器名称（可选）>`)
                }
            }

            /*
            查询经济部分
            */

            if(pt[0] == economy_cmd){
                switch(pt.length){
                    case 1:
                        let qq = e.sender.qq;
                        let xbox_id = NIL._vanilla.get_xboxid(qq);
                        server.sendCMD(`money query ` + xbox_id, (callback) => {
                            let res = callback.replace(economy_regex, `玩家` + xbox_id + `在` + server_name + `的经济余额：$2`);
                            e.reply(res);
                        });
                        if(second_server == true){
                            server_2.sendCMD(`money query ` + xbox_id, (callback) => {
                                let res = callback.replace(economy_regex, `玩家` + xbox_id + `在` + server_name_2 + `的经济余额：$2`);
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
                                    let res = callback.replace(economy_regex, `玩家` + xbox_id + `在` + server_name + `的经济余额：$2`);
                                    e.reply(res);
                                });
                                if(second_server == true){
                                    server_2.sendCMD(`money query ` + xbox_id, (callback) => {
                                        let res = callback.replace(economy_regex, `玩家` + xbox_id + `在` + server_name_2 + `的经济余额：$2`);
                                        e.reply(res);
                                    });
                                }
                            }else{
                                e.reply(`该群员未绑定白名单`, true);
                            }
                        });
                        break
                    case 3:
                        var at = getAt(e);
                        at.forEach(element => {
                            if(NIL._vanilla.wl_exists(element) == true){
                                let xbox_id = NIL._vanilla.get_xboxid(element);
                                server.sendCMD(`money query ` + xbox_id, (callback) => {
                                    let res = callback.replace(economy_regex, `玩家` + xbox_id + `在` + server_name + `的经济余额：$2`);
                                    e.reply(res);
                                });
                                if(second_server == true){
                                    server_2.sendCMD(`money query ` + xbox_id, (callback) => {
                                        let res = callback.replace(economy_regex, `玩家` + xbox_id + `在` + server_name_2 + `的经济余额：$2`);
                                        e.reply(res);
                                    });
                                }
                            }else{
                                e.reply(`该群员未绑定白名单`, true);
                            }
                        });
                        break
                    default:
                        e.reply(`格式：` + economy_cmd + ` <@群成员（可选）>`);

                }
            }
            
            /*
            实体查询部分
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
            管理员部分
            */

            if(NIL._vanilla.isAdmin(e.sender.qq) == true){
                
                /*
                重启部分
                */

                if(pt[0] == `重启`){
                    switch(pt.length){
                        case 2:
                            if(pt[1] == server_name){
                                if(server_status == 1){
                                    server.sendStop();
                                    server_status = 0;
                                }else{
                                    e.reply(server_name + ` 未开启`);
                                }
                            }
                            if(pt[1] == server_name_2){
                                if(server_status_2 == 1){
                                    server_2.sendStop();
                                    server_status_2 = 0;
                                }else{
                                    e.reply(server_name_2 + ` 未开启`);
                                }
                            }
                            break
                        default:
                            e.reply(`格式：重启 <服务器名称>`)
                    }
                }

                /*
                实体清理部分
                */

                if(pt[0] == clean_entity_cmd){
                    switch(pt.length){
                        case 2:
                            let target = pt[1]; // 读取清理目标
                            let target_id = typelist[target]; // 读取目标英文

                            if(target_id != undefined){
                                server.sendCMD(`/say 将在` + default_delay/1000 + `秒后清理` + target, (callback) => {
                                    //
                                });
                                if(second_server == true){
                                    server_2.sendCMD(`/say 将在` + default_delay/1000 + `秒后清理` + target, (callback) => {
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
                                e.reply(target + `清理完毕！`);
                                break
                            }else{
                                e.reply(`没有这个项目：` + target);
                                break
                            }

                        case 3:
                            let delay = pt[2];
                            if(target_id != undefined){
                                server.sendCMD(`/say 将在` + delay + `秒后清理` + target, (callback) => {
                                    //
                                });
                                if(second_server == true){
                                    server_2.sendCMD(`/say 将在` + delay + `秒后清理` + target, (callback) => {
                                        //
                                    });
                                }
                                break
                            }else{
                                e.reply(`格式：` + clean_entity_cmd + ` <清理项目> <延迟（可选）>`);
                                break
                            }
                        default:
                            e.reply(`格式：` + clean_entity_cmd + ` <清理项目> <延迟（可选）>`);
                    }
                }

                /*
                封禁部分
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
        oicq监听部分
        */

        bot.on(`request.group.invite`, (e) => { // 自动同意加群申请
            if(auto_agree_group == true){
                e.approve();
            }
        });

        bot.on(`request.friend.add`, (e) => { // 自动同意好友申请
            if(auto_agree_friend == true){
                e.approve();
            }
        });

        bot.on(`request.group.add`, (e) => { // 自动群审核
            if(auto_agree_group == true){
                e.approve();
            }
        })

        bot.on(`message.group`, (e) => {
            let text = getText(e);
            let pt = text.split(` `);

            /*
            if(pt[0] == `/禁言`){
                if(e.member.is_owner() == true){
                    switch(pt.length){
                        case 2: // 永久禁言
                            var at = getAt(e);
                            at.forEach(element => {
                                e.group.muteMember(element);
                                e.group.sendMsg(`群成员` + pt[1] + `已被禁言！`, true);
                            });
                            break
                        case 3: // 限时禁言
                            if(myIsNaN(pt[2]) == true){
                                var at = getAt(e);
                                at.forEach(element => {
                                    e.group.muteMember(element, pt[2]);
                                    e.group.sendMsg(`群成员` + pt[1] + `已被禁言` + pt[3] + `秒！`);
                                });
                            }else{
                                e.group.sendMsg(`格式：` + mute_cmd + ` <@群成员> <禁言时长（可选）>`);
                            }
                            break
                        default:
                            e.group.sendMsg(`格式：` + mute_cmd + ` <@群成员> <禁言时长（可选）>`);
                    
                    }
                }else{
                    e.group.sendMsg(`你没有权限使用该功能！`);
                }
            }
            */

        })

    }
    onStop(api){

    }
}

module.exports = new MagicUtility
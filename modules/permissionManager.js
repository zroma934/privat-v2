/**
 * Created by julia on 13.11.2016.
 */
var permModel = require('../DB/permission');
var winston = require('winston');
var async = require("async");
var config = require('../config/main.json');
var util = require("util");
/**
 * The permission manager, it loads all permissions from the database and builds the permission tree
 */
class PermissionManager {
    /**
     * Initalize the instance variable in the constructor
     */
    constructor() {
        this.msg = null;
        this.guild = null;
        this.node = null;
        this.cat = null;
        this.cmd = null;
    }

    /**
     * The base function to check if a user is allowed to do sth.
     * @param msg - The msg of the command that should be check
     * @param node - the permission node category.command
     * @param cb - the callback
     */
    checkPermission(msg, node, cb) {
        this.msg = msg;
        this.guild = msg.guild;
        this.node = node;
        let nodeSplit = node.split('.');
        this.cat = nodeSplit[0];
        this.cmd = nodeSplit[1];
        this.loadPermission(msg, (err) => {
            cb(err);
        });

    }

    /**
     * Loads the permission document out of the database
     * @param msg - the message, so we can get the id of the guild to load the perms per guild
     * @param cb - the callback
     */
    loadPermission(msg, cb) {
        permModel.findOne({id: msg.guild.id}, (err, Perms) => {
            if (err) return cb(err);
            if (Perms) {
                this.buildPermTree(Perms);
            } else {
                Perms = [
                    {type: 'guild', id: '228604101800230912', cat: '*', perm: '*', use: true},
                    {type: 'guild', id: '228604101800230912', cat: 'fun', perm: 'lenny', use: true},
                    {type: 'guild', id: '228604101800230912', cat: 'fun', perm: 'lenny', use: false},
                    {type: 'guild', id: '228604101800230912', cat: 'fun', perm: 'lenny', use: true},
                    {type: 'channel', id: '228604101800230912', cat: 'fun', perm: 'lenny', use: false},
                    {type: 'channel', id: '228604101800230912', cat: 'fun', perm: 'lenny', use: true},
                    {type: 'role', id: '218549272658968577', cat: 'fun', perm: 'flip', use: true},
                    {type: 'role', id: '244643936553926656', cat: 'fun', perm: 'flip', use: false}
                ];
                this.buildPermTree(Perms, cb);
            }
        })
    }

    /**
     * Build the json object known as the mighty permission tree,
     * JK it build a big json object with all the perms combined, that makes it easier to
     * @param Perms
     * @param cb
     */
    buildPermTree(Perms, cb) {
        let tree = {channel: {}, user: {}, role: {}};
        async.each(Perms, (Perm, cb) => {
            switch (Perm.type) {
                case "guild":
                    if (!tree[Perm.cat]) {
                        tree[Perm.cat] = {};
                    }
                    if (typeof (tree[Perm.cat][Perm.perm]) === 'undefined') {
                        tree[Perm.cat][Perm.perm] = Perm.use;
                    }
                    if (tree[Perm.cat][Perm.perm]) {
                        tree[Perm.cat][Perm.perm] = Perm.use;
                    }
                    async.setImmediate(() => {
                        cb();
                    });
                    return;
                case "channel":
                    if (Perm.id === this.msg.channel.id) {
                        if (!tree.channel[Perm.cat]) {
                            tree.channel[Perm.cat] = {};
                        }
                        if (typeof (tree.channel[Perm.cat][Perm.perm]) === 'undefined') {
                            tree.channel[Perm.cat][Perm.perm] = Perm.use;
                        }
                        if (tree.channel[Perm.cat][Perm.perm]) {
                            tree.channel[Perm.cat][Perm.perm] = Perm.use;
                        }
                    }
                    async.setImmediate(() => {
                        cb();
                    });
                    return;
                case "role":
                    if (this.msg.member.roles.exists('id', Perm.id)) {
                        if (!tree.role[Perm.cat]) {
                            tree.role[Perm.cat] = {};
                        }
                        if (typeof (tree.role[Perm.cat][Perm.perm]) === 'undefined') {
                            tree.role[Perm.cat][Perm.perm] = Perm.use;
                        }
                        if (tree.role[Perm.cat][Perm.perm]) {
                            tree.role[Perm.cat][Perm.perm] = Perm.use;
                        }
                    }
                    async.setImmediate(() => {
                        cb();
                    });
                    return;
                case "user":
                    if (this.msg.author.id === Perm.id) {
                        if (!tree.user[Perm.cat]) {
                            tree.user[Perm.cat] = {};
                        }
                        if (typeof (tree.user[Perm.cat][Perm.perm]) === 'undefined') {
                            tree.user[Perm.cat][Perm.perm] = Perm.use;
                        }
                        if (tree.user[Perm.cat][Perm.perm]) {
                            tree.user[Perm.cat][Perm.perm] = Perm.use;
                        }
                    }
                    async.setImmediate(() => {
                        cb();
                    });
                    return;
            }
        }, (err) => {
            this.checkTree(tree, cb);
        });
    }

    checkTree(tree, cb) {
        let finalPerms = {user: true, role: true, channel: true, guild: true};
        finalPerms.user = this.uwu(tree.user);
        finalPerms.role = this.uwu(tree.role);
        finalPerms.channel = this.uwu(tree.channel);
        finalPerms.guild = this.uwu(tree);
        let res = this.owo(finalPerms);
        if (res) {
            return cb();
        } else {
            return cb('NOPE');
        }
    }

    owo(finalPerms) {
        if (finalPerms.user === true) {
            return true;
        }
        if (finalPerms.user === false) {
            return false;
        }
        if (finalPerms.user === '-') {
            if (finalPerms.role === true) {
                return true;
            }
            if (finalPerms.role === false) {
                return false;
            }
            if (finalPerms.role === '-') {
                if (finalPerms.channel === true) {
                    return true;
                }
                if (finalPerms.channel === false) {
                    return false;
                }
                if (finalPerms.channel === '-') {
                    if (finalPerms.guild === true) {
                        return true;
                    }
                    if (finalPerms.guild === false) {
                        return false;
                    }
                    if (finalPerms.guild === '-') {
                        return false;
                    }
                }
            }
        }
    }

    uwu(tree) {
        if (tree[this.cat] || tree['*']) {
            if (tree[this.cat]) {
                if (tree[this.cat].hasOwnProperty(this.cmd) || tree[this.cat].hasOwnProperty('*')) {
                    if (tree[this.cat].hasOwnProperty(this.cmd)) {
                        if (!tree[this.cat][this.cmd]) {
                            return false;
                        }
                    } else {
                        if (!tree[this.cat]['*']) {
                            return false;
                        }
                    }
                } else {
                    return "-";
                }
            } else {
                if (!tree['*']['*']) {
                    return false;
                }

            }
            return true;
        } else {
            return '-';
        }
    }

    checkDiscordRoles(msg) {
        if (msg.author.id === config.owner_id) {
            return true;
        }
        if (msg.member.roles.exists('name', 'WolkeBot')) {
            return true;
        }
        if (msg.author.equals(msg.guild.owner.user)) {
            return true;
        }
        msg.member.roles.map(r => {
            if (r.hasPermission('ADMINISTRATOR')) {
                return true;
            }
        });
        return false;
    }
}
module.exports = PermissionManager;
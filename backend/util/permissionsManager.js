const db = require('../db/db');
module.exports = class permissionsManager {
    permissions = {}

    constructor(settingsManager) {
        this.settingsManager = settingsManager;
    }
    perms = (perm) => {
        return async (req, res, next) => {
            let roles = this.settingsManager.settings.roles;
            if (!req.session.userid) return res.status(401).send('You do not have permission to do this')
            let user = await db.user.findOne({ userid: parseInt(req.session.userid) });
            if (!user) return res.status(401).send('Invalid user');
            if (!req.session.userid) return res.status(401);
            if (user.role == null || user.role == undefined) return res.status(401);
            if (!perm) return next()
            if (user.role === 0) return next();
            let role = roles.find(r => r.id == user.role);
            if (!role) return res.status(401);
            if (role.permissions.includes(perm)) {
                next()
            } else {
                res.status(401).send('You do not have permission to do this')
            }
        }
    };

    checkPerm = async (uid, perm) => {
        let roles = this.settingsManager.settings.roles;
        let user = await db.user.findOne({ userid: parseInt(uid) });
        if (!user) return false;
        if (user.role == null || user.role == undefined) return false;
        if (!perm) return true
        if (user.role == 0) return true;
        let role = roles.find(r => r.id == user.role);
        if (!role) return false;
        return role.permissions.includes(perm);
    };

}

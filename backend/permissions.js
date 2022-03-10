const db = require('./db/db');
const perms = (perm) => {
    return async (req, res, next) => {
        let sid = req.headers?.id ?? res.query?.wsid;
        if (!sid) return res.status(404).send('No workspace id provided');
        console.log(typeof (sid))
        let id;
        try {
            id = parseInt(sid);
        } catch (e) {
            return res.status(404).send('Invalid workspace id');
        };
        console.log(id)
        if (!id) return res.status(404).send('Invalid workspace id');
        console.log('no')
        let workspace = await db.workspace.findOne({ id: id });
        if (!workspace) return res.status(404).send('Workspace not found');

        let roles = workspace.settings.find(s => s.name == 'roles');
        let r = workspace.users.find(u => u.userid == req.session.userid)?.role;
        if (!req.session.userid) return res.status(401);
        if (r == null || r == undefined) return res.status(401);
        if (!perm) return next()
        if (r == 0) return true;
        let role = roles.find(r => r.id == r);
        if (!role) return res.status(401);
        if (role.permissions.includes(perm)) {
            next()
        } else {
            res.status(401).send('You do not have permission to do this')
        }
    }
};

const wsperms = async (perm, id, uid) => {
    let sid = id;
    if (!sid) return false;
    console.log(typeof (sid))
    try {
        id = parseInt(sid);
    } catch (e) {
        return false;
    };
    console.log(id)
    if (!id) return false;
    console.log('no')
    let workspace = await db.workspace.findOne({ id: id });
    if (!workspace) return false;

    let roles = workspace.settings.find(s => s.name == 'roles');
    let r = workspace.users.find(u => u.userid == uid)?.role;
    if (!uid) return false
    if (r == null || r == undefined) return false;
    if (!perm) return true
    if (r == 0) return true;
    let role = roles.find(r => r.id == r);
    if (!role) return false;
    if (role.permissions.includes(perm)) {
        return true
    } else {
        return false
    }

};

module.exports = {
    perms, wsperms
}
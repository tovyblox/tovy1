const nodecache = require("node-cache");
const noblox = require("noblox.js");
const { createClient } = require("redis");
module.exports = class CacheEngine {
  constructor() {
    this.isRedis = !!process.env.REDIS_URI?.length;
    if (!this.isRedis) {
      this.usernames = new nodecache({
        stdTTL: 60 * 60 * 24 * 7,
        checkperiod: 60 * 60 * 24 * 7,
      });
      this.pfps = new nodecache({
        stdTTL: 60 * 60 * 24 * 7,
        checkperiod: 60 * 60 * 24 * 7,
      });
    } else {
      this.client = createClient({
        url: process.env.REDIS_URI,
      });
      this.client.connect();
    }
  }

  async fetchusername(uid) {
    return new Promise(async (resolve, reject) => {
      if (this.isRedis) {
        if (await this.client.get(`usernames:${parseInt(uid)}:username`)) {
          resolve(await this.client.get(`usernames:${parseInt(uid)}:username`));
          if (await this.client.get(`usernames:${parseInt(uid)}:uses`) > 20) {
            let userinfo = await noblox.getUsernameFromId(uid); 
            this.client.set(`usernames:${parseInt(uid)}:username`, userinfo);
            this.client.set(`usernames:${parseInt(uid)}:uses`, 1);
          } else {
            this.client.incr(`usernames:${parseInt(uid)}:uses`);
          }
          return;
        }
        let userinfo = await noblox.getUsernameFromId(uid);
        this.client.set(`usernames:${parseInt(uid)}:username`, userinfo);
        this.client.set(`usernames:${parseInt(uid)}:uses`, 1);

        resolve(userinfo);
      } else {
        if (this.usernames.get(uid)) {
          resolve(this.usernames.get(uid).username);
          let thing = this.usernames.get(uid)

          if (thing.uses > 20) {
            let username = await noblox.getUsernameFromId(uid);
            this.usernames.set(uid, {username, uses: 1 });
          } else {
            thing.uses += 1;
            this.usernames.set(parseInt(uid), thing);
          }
          return;
        }
        let username = await noblox.getUsernameFromId(uid);
        this.usernames.set(uid, {username, uses: 1});

        resolve(username);
      }
    });
  }

  async fetchpfp(uid) {
    return new Promise(async (resolve, reject) => {
      if (this.isRedis) {
        if (await this.client.get(`pfps:${parseInt(uid)}:pfp`)) {
          resolve(await this.client.get(`pfps:${parseInt(uid)}:pfp`));
          if (this.client.get(`pfps:${parseInt(uid)}:uses`) > 20) {
            let pfp = await noblox.getPlayerThumbnail({
              userIds: uid,
              cropType: "headshot",
            });
            this.client.set(`pfps:${parseInt(uid)}:pfp`, pfp[0].imageUrl);
            this.client.set(`pfps:${parseInt(uid)}:uses`, 1);
          } else {
            this.client.incr(`pfps:${parseInt(uid)}:uses`);
          }
          return;
        }
        let pfp = await noblox.getPlayerThumbnail({
          userIds: uid,
          cropType: "headshot",
        });
        this.client.set(`pfps:${parseInt(uid)}:pfp`, pfp[0].imageUrl);
        this.client.set(`pfps:${parseInt(uid)}:uses`, 1);

        resolve(pfp[0].imageUrl);
      } else {
        if (this.pfps.get(uid)) {
          resolve(this.pfps.get(uid).pfp);
          
          let thing = this.pfps.get(uid)
          if (thing.uses > 20) {
            let pfp = await noblox.getPlayerThumbnail({
              userIds: uid,
              cropType: "headshot",
            });
            this.pfps.set(uid, {pfp: pfp[0].imageUrl, uses: 1});
          } else {
            thing.uses += 1;
            this.pfps.set(parseInt(uid), thing);
          }
          return;
        }
        let pfp = await noblox.getPlayerThumbnail({
          userIds: uid,
          cropType: "headshot",
        });
        this.pfps.set(uid, {pfp: pfp[0].imageUrl, uses: 1});

        resolve(pfp[0].imageUrl);
      }
    });
  }
};

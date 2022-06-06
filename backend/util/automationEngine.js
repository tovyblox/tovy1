const db = require("../db/db");
const Discord = require("discord.js");
const { events } = require("../db/schemas/user.schema");
let eventTypes = {
  dtypes: [
    {
      name: "Session started",
      description: "A session has been created",
      value: "sessionstarted",
      data: {
        id: "ID of the session",
        username: "Username of the user who created the session",
        type: "Type of session",
        game: "Name of game that the session is being hosted in session",
      },
    },
    {
      name: "Session ended",
      description: "Fired when an event has been eneded",
      value: "sessionended",
      data: {
        id: "ID of the session",
        username: "Username of the user who created the session",
        type: "Type of session",
        game: "Name of game that the session is being hosted in session",
      },
    },
    {
      name: "Staff join",
      description: "Fired when a staff has joined the game",
      value: "staffjoin",
      data: {
        id: "ID of the staff member",
        username: "Username of the staff member",
      },
    },
    {
      name: "Staff left",
      description: "Fired when a staff has left the game",
      value: "staffleft",
      data: {
        id: "ID of the staff member",
        username: "Username of the staff member",
      },
    },
    {
      name: "Staff suspended",
      description: "Fired when a staff has been suspended",
      value: "staff_suspension",
      data: {
        id: "ID of the staff member",
        username: "Username of the staff member",
        moderator: "Username of the moderator",
        notes: "Notes about the suspension",
      },
    },
    {
      name: "Staff unsuspended",
      description: "Fired when a staff has been unsuspended",
      value: "staff_unsuspension",
      data: {
        id: "ID of the staff member",
        username: "Username of the staff member",
        moderator: "Username of the moderator",
        notes: "Notes about the unsuspension",
      },
    },
    {
      name: "Staff fired",
      description: "Fired when a staff has been fired",
      value: "staff_fire",
      data: {
        id: "ID of the staff member",
        username: "Username of the staff member",
        moderator: "Username of the moderator",
        notes: "Notes about the fire",
      },
    },
    {
      name: "Staff promoted",
      description: "Fired when a staff has been promoted",
      value: "staff_promotion",
      data: {
        id: "ID of the staff member",
        username: "Username of the staff member",
        moderator: "Username of the moderator",
        notes: "Notes about the promotion",
      },
    },
    {
      name: "Staff demoted",
      description: "Fired when a staff has been demoted",
      value: "staff_demotion",
      data: {
        id: "ID of the staff member",
        username: "Username of the staff member",
        moderator: "Username of the moderator",
        notes: "Notes about the demoation",
      },
    },
    {
      name: "Task created",
      description: "Fired when a task has been created",
      value: "taskcreated",
      data: {
        id: "ID of the task",
        username: "Username of the staff member who created the task",
        name: "Name of the task",
        details: "Details of the task",
      },
    },
    {
      name: "Task completed",
      description: "Fired when a task has been completed",
      value: "taskcompleted",
      data: {
        id: "ID of the task",
        username: "Username of the staff member who completed the task",
        name: "Name of the task",
        details: "Details of the task",
      },
    },
  ],
  atypes: [
    {
      name: "Discord webhook",
      value: "webhook",
      icon: "mdi-webhook",
      data: {
        content: {
          type: "text",
          name: "Content",
        },
        url: {
          type: "text",
          name: "URL",
        },
      },
    },
    {
      name: "Wall post",
      value: "wallpost",
      icon: "mdi-webhook",
      data: {
        content: {
          type: "longtext",
          name: "Wall message",
        },
      },
    },
    {
      name: "Group shout",
      value: "groupshout",
      icon: "mdi-webhook",
      data: {
        content: {
          type: "text",
          name: "Group shout",
        },
      },
    },
    {
      name: "Rank user",
      value: "setrank",
      icon: "mdi-webhook",
      data: {
        uid: {
          type: "text",
          name: "User ID",
        },
        rank: {
          type: "dropdown",
          name: "rank",
          options: [],
        },
      },
    },
  ],
};

module.exports = class automationEngine {
  constructor(loggingEngine, settingsEngine, noblox) {
    this.loggingEngine = loggingEngine;
    this.settingsEngine = settingsEngine;
    this.noblox = noblox;
  }

  async runEvent(eventtype, data) {
    const events = await db.automation.find({ eventtype: eventtype });
    events.forEach((event) =>
      event.actions.forEach((action) => {
        switch (action.actionType) {
          case "webhook": {
            let adata = action.data;
            if (!adata.url)
              return this.loggingEngine.newAutomationLog(
                `No URL specified for webhook action | ${event.name}`
              );
            if (!adata.content)
              this.loggingEngine.newAutomationLog(
                `No content specified for webhook action | ${event.name}`
              );
            let eevent = eventTypes.dtypes.find((e) => e.value === eventtype);
            let text = this.gmsg(adata.content, data, eevent.data);
            try {
              this.webhookAction(text, adata.url);
            } catch (e) {
              return this.loggingEngine.newAutomationLog(
                `Error while running webhook action | ${event.name} | ${e}`
              );
            }
            this.loggingEngine.newAutomationLog(
              `${event.name} has run successfully`
            );
            break;
          }
          case "wallpost": {
            let adata = action.data;
            if (!adata.content)
              return this.loggingEngine.newAutomationLog(
                `No content specified for wallpost action | ${event.name}`
              );
            let eevent = eventTypes.dtypes.find((e) => e.value === eventtype);
            let text = this.gmsg(adata.content, data, eevent.data);
            try {
              this.wallpostAction(text);
            } catch (e) {
              return this.loggingEngine.newAutomationLog(
                `Error while running wallpost action | ${event.name} | ${e}`
              );
            }
            this.loggingEngine.newAutomationLog(
              `${event.name} has run successfully`
            );
            break;
          }
          case "groupshout": {
            let adata = action.data;
            if (!adata.content)
              return this.loggingEngine.newAutomationLog(
                `No content specified for groupshout action | ${event.name}`
              );
            let eevent = eventTypes.dtypes.find((e) => e.value === eventtype);
            let text = this.gmsg(adata.content, data, eevent.data);
            try {
              this.groupshoutAction(text);
            } catch (e) {
              return this.loggingEngine.newAutomationLog(
                `Error while running groupshout action | ${event.name} | ${e}`
              );
            }
            this.loggingEngine.newAutomationLog(
              `${event.name} has run successfully`
            );
          }
          case "setrank": {
            let adata = action.data;
            if (!adata.uid) {
              return this.loggingEngine.newAutomationLog(
                `No user ID specified for setrank action | ${event.name}`
              );
            }
            if (!adata.rank) {
              return this.loggingEngine.newAutomationLog(
                `No rank specified for setrank action | ${event.name}`
              );
            }
            console.log(adata.rank)
            let eevent = eventTypes.dtypes.find((e) => e.value === eventtype);
            let text = this.gmsg(adata.uid, data, eevent.data);
            try {
              this.setRankAction( text, adata.rank);
            }
            catch (e) {
              console.log(e);
              return this.loggingEngine.newAutomationLog(
                `Error while running setrank action | ${event.name} | ${e}`
              );
            }
            this.loggingEngine.newAutomationLog(
              `${event.name} has run successfully`
            );
          }
        }
      })
    );
  }
  async webhookAction(content, url) {
    try {
      const webhook = new Discord.WebhookClient({ url });
      webhook.send(content);
    } catch (e) {
      throw e;
    }
  }
  async wallpostAction(content) {
    try {
      let id = await db.message.countDocuments({});

      let data = {
        id: id + 1,
        automated: true,
        message: content,
        author: 3327255361,
        date: Date.now(),
        deleted: false,
      };

      await db.message.create(data);
    } catch (e) {
      throw e;
    }
  }
  async groupshoutAction(content) {
    if (!this.settingsEngine.get("ranking")?.uid) throw "Not logged in";
    try {
      let group = this.settingsEngine.get("group");
      if (!group) throw "No group set";
      await this.noblox.shout(group, content);
    } catch (e) {
      throw e;
    }
  }
  async setRankAction(userid, rank) {
    console.log(userid)
    if (!this.settingsEngine.get("ranking")?.uid) throw "Not logged in";
    try {
      let group = this.settingsEngine.get("group");
      if (!group) throw "No group set";
      console.log(rank)
      await this.noblox.setRank(group, userid, rank);
    } catch (e) {
      throw e;
    }
  }

  gmsg(text, data, rdata) {
    let replacements = {};
    for (const r in rdata) {
      replacements[`%${r}%`] = data[r];
    }

    return text.replace(/%\w+%/g, (all) => {
      return typeof replacements[all] !== "undefined" ? replacements[all] : all;
    });
  }
};

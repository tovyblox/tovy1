<template>
  <div class="mx-3 mb-5">
    <v-text-field
      @input="update"
      v-model="value.name"
      label="Automation name"
      outlined
    ></v-text-field>
    <v-row class="mx-0 mb-3">
      <v-btn @click="createaction" class="elevation-0 ml-auto" color="success">
        Add action</v-btn
      ></v-row
    >

    <v-card class="mb-3">
      <v-card-title> Event </v-card-title>
      <div class="pb-3">
        <v-select
          class="mx-3 mb-3"
          outlined
          label="Type"
          :items="dtypes"
          item-text="name"
          item-value="value"
          @change="update"
          hide-details="auto"
          v-model="value.eventtype"
        />
        <div class="mx-3" v-if="value.eventtype">
          <p class="blue--text text-h5 font-weight-bold">Variables</p>
          <p class="green--text mt-n4" style="white-space: pre-line">
            {{
              Object.entries(dtypes.find((s) => s.value === value.eventtype).data)
                .map(([d, k]) => `%${d}%: ${k}`)
                .join(`\n`)
            }}
          </p>
        </div>
      </div>
    </v-card>
    <draggable v-model="value.actions">
      <v-card v-for="(action, i) in value.actions" :key="i" :class="`mb-2 native hover`"
        ><span class="grippy ml-3 mb-n4 mt-n5" />
        <v-card-title> Action {{ action.id }} </v-card-title>
        <div class="mx-3 pb-4">
          <v-select
            label="action type"
            :items="atypes"
            outlined
            item-text="name"
            @change="update"
            item-value="value"
            hide-details="auto"
            v-model="action.actionType"
          />
          <div v-if="action.actionType">
            <v-select
              v-for="(field, i) in fetchFields(action, 'dropdown')"
              :key="i"
              :items="field.options"
              v-model="action.data[field.value]"
              :label="field.name"
              item-text="name"
              hide-details="auto"
              @change="update"
              outlined
              class="mt-3"
            />
            <v-text-field
              v-for="(field, i) in fetchFields(action, 'text')"
              :key="i"
              v-model="action.data[field.value]"
              :label="field.name"
              hide-details="auto"
              outlined
              @input="update"
              class="mt-3"
            />
            <v-textarea
              v-for="(field, i) in fetchFields(action, 'longtext')"
              :key="i"
              v-model="action.data[field.value]"
              :label="field.name"
              hide-details="auto"
              outlined
              @input="update"
              class="mt-3"
            />
          </div>
        </div>
      </v-card>
    </draggable>
    <v-snackbar v-model="toast.visible">
      {{ toast.message }}

      <template v-slot:action="{ attrs }">
        <v-btn :color="toast.color" text v-bind="attrs" @click="toast.visible = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script>
import draggable from "vuedraggable";
export default {
  name: "HelloWorld",
  props: ["value"],
  data: function () {
    return {
      drawer: true,
      loading: false,
      dog: false,
      toast: {
        message: "",
        color: "success",
        visible: false,
      },
      selectedEvent: "",
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
      actions: [
        {
          type: "",
          data: {},
        },
        {
          type: "",
          data: {},
        },
      ],
      groups: "dog",
    };
  },
  components: {
    draggable,
  },
  created() {
    this.$http.get("/settings/groles", { withCredentials: true }).then((response) => {
      this.atypes.find(
        (s) => s.value === "setrank"
      ).data.rank.options = response.data.roles.map((s) => {
        return {
          name: s.name,
          value: s.id,
        };
      });
    });
    this.value.actions.forEach((s) => {
      this.checkAction(s);
    });
  },
  methods: {
    createaction: function () {
      this.value.actions.push({
        type: "",
        data: {},
      });
    },
    update() {
      this.$http
        .patch("/settings/automation/" + this.value.id, {
          name: this.value.name,
          eventtype: this.value.eventtype,
          actions: this.value.actions,
        })
        .then((response) => {
          console.log(response);
        });
    },

    fetchFields: function (event, fieldType) {
      let type = this.atypes.find((s) => s.value === event.actionType);
      let array = Object.entries(type.data)
        .map(([a, b]) => ({
          value: a,
          ...b,
        }))
        .filter((s) => s.type === fieldType);

      return array;
    },
    setType: function (event, type) {
      let action = this.atypes.find((a) => a.name === type);
      event.data = {};
      for (const prop in action.data) {
        event.data[prop] = "";
      }
    },
    checkAction: function (event) {
      let action = this.atypes.find((a) => a.name === event.eventtype);
      if (!event.data) event.data = {};
      for (const prop in action.data) {
        if (event.data[prop]) {
          console.log("it feels so good");
          continue;
        }
        event.data[prop] = "";
      }
      return event;
    },
  },
};
</script>
<style>
span.grippy {
  content: ".........................................";
  height: 50px;
  border-radius: 2px;
  display: inline-block;
  overflow: hidden;
  padding: 3px 4px;
  cursor: move;
  vertical-align: middle;
  font-size: 36px;
  letter-spacing: 2px;
  color: #b3acab;
}

.no-select {
  user-select: none;
}
span.grippy::after {
  content: "...";
}
.pointer {
  cursor: pointer;
}
</style>

<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">Welcome to Tovy tasks</p>
      </v-container>
    </v-sheet>

    <v-container class="mt-n16 mx-auto">
      <v-card
        min-width="300"
        v-if="
          $store.state.user.perms.includes('manage_tasks')
        "
        @click="
          // make the dialog active
          dialog.active = true
        "
        ripple
        class=""
      >
        <v-card-title> 📋 Create a task </v-card-title>
        <v-card-text class="mt-n6 mb-6"> Create a task for your team. </v-card-text>
      </v-card>
      
      <v-row class="mx-0 my-n7 pb-4" > 
       <v-switch v-model="showCompleted" class="mx-auto"  label="Show completed tasks"> </v-switch>
       </v-row> 

      <v-row align="center">
        <v-col
          v-for="item in gettasks"
          :key="item.id"
          cols="12"
          class="mt-n4"
          sm="6"
          md="4"
          lg="3"
          ><v-card outlined :class="`py-n1 ${item.selected ? 'selected' : ''}`">
            <div>
              <v-card-title>
                {{ item.name }}
                <v-menu offset-y>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      icon
                      v-bind="attrs"
                      v-on="on"
                      class="ml-auto"
                      color="grey"
                      v-if="item.author === $store.state.user.id"
                    >
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item link>
                      <v-list-item-title @click="deleteTask(item.id)"
                        >Delete</v-list-item-title
                      >
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-card-title>
              <v-card-text class="mt-n6 grey--text">
                {{ item.description }}
              </v-card-text>
              <v-layout>
                <v-avatar
                  class="my-auto ml-4 mr-n2"
                  :color="$store.state.group.color"
                  size="25"
                >
                  <v-img :src="item.pfp"></v-img>
                </v-avatar>
                <div>
                  <v-card-text class="grey--text">@{{ item.username }}</v-card-text>
                </div></v-layout
              >
              <v-card-text
                v-if="item.priority === 1"
                class="green--text mt-n6 font-weight-bold"
                >Low priorty</v-card-text
              >
              <v-card-text
                v-if="item.priority === 2"
                class="blue--text mt-n6 font-weight-bold"
                >Medium priorty</v-card-text
              >
              <v-card-text
                v-if="item.priority === 3"
                class="red--text mt-n6 font-weight-bold"
                >High priorty</v-card-text
              >
              <v-card-text v-if="!item.completed" class="blue--text mt-n8 font-weight-bold"
                >Due {{ getDate(item.due) }}</v-card-text
              >
              <v-card-text v-if="item.completed" class="green--text mt-n8 font-weight-bold"
                >Completed</v-card-text
              >
            </div>
            <v-divider></v-divider>
            <v-layout wrap class="py-2 px-2" align="right">
              <v-btn @click="completeTask(item)" :disabled="item.completed" color="success" plain> Mark as complete </v-btn>
            </v-layout>
          </v-card></v-col
        ></v-row
      >
    </v-container>
    <v-dialog v-model="dialog.active" max-width="600px">
      <v-progress-linear
        :color="$store.state.group.color"
        indeterminate
        v-if="dialog.loading"
        reverse
      ></v-progress-linear>
      <v-stepper v-model="dialog.page">
        <v-stepper-header>
          <v-stepper-step :complete="dialog.page > 1" step="1"> Due date </v-stepper-step>

          <v-divider></v-divider>

          <v-stepper-step :complete="dialog.page > 2" step="2">
            Task details
          </v-stepper-step>

          <v-divider></v-divider>

          <v-stepper-step step="3"> Assignment </v-stepper-step>
        </v-stepper-header>

        <v-stepper-items>
          <v-stepper-content step="1">
            <v-date-picker
              :min="getcur()"
              class="mb-3"
              dark
              full-width
              :color="$store.state.group.color"
              v-model="newTask.due"
            ></v-date-picker>

            <v-btn color="primary" @click="dialog.page++"> Continue </v-btn>

            <v-btn text @click="dialog.active = false"> Cancel </v-btn>
          </v-stepper-content>

          <v-stepper-content step="2">
            <v-text-field
              label="Task Name"
              outlined
              v-model="newTask.name"
              required
              :rules="[(v) => !!v || 'Name is required']"
              class="mb-3"
              hide-details="auto"
            ></v-text-field>
            <v-textarea
              outlined
              label="Task Description"
              :rules="[(v) => !!v || 'Description is required']"
              v-model="newTask.description"
              required
              class="mb-4"
              hide-details="auto"
            ></v-textarea>
            <v-select
              :items="[
                { title: 'High', value: 3 },
                { title: 'Medium', value: 2 },
                { title: 'Low', value: 1 },
              ]"
              label="Priority"
              item-text="title"
              item-value="value"
              outlined
              v-model="newTask.priority"
            ></v-select>

            <v-btn color="primary" @click="dialog.page++"> Continue </v-btn>

            <v-btn text @click="dialog.page--"> Previous </v-btn>
          </v-stepper-content>

          <v-stepper-content step="3">
            <v-autocomplete
              v-model="newTask.assignedUsers"
              :items="dialog.users"
              outlined
              small-chips
              cache-items
              hide-details="auto"
              color="blue-grey lighten-2"
              label="Members"
              item-text="username"
              item-value="id"
              @update:search-input="(i) => autoinput(i)"
              class="mt-1"
              multiple
            >
              <template v-slot:selection="data">
                <v-chip
                  v-bind="data.attrs"
                  :input-value="data.selected"
                  close
                  @click="data.select"
                  @click:close="remove(data.item)"
                >
                  <v-avatar left>
                    <v-img :src="data.item.pfp"></v-img>
                  </v-avatar>
                  {{ data.item.username }}
                </v-chip>
              </template>
              <template v-slot:item="data">
                <template>
                  <v-list-item-avatar>
                    <img :src="data.item.pfp" />
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title v-html="data.item.username"></v-list-item-title>
                    <v-list-item-subtitle
                      v-html="data.item.displayName"
                    ></v-list-item-subtitle>
                  </v-list-item-content>
                </template>
              </template>
            </v-autocomplete>

            <v-autocomplete
              class="mt-3"
              v-model="newTask.assignedRoles"
              :items="dialog.roles"
              item-text="name"
              item-value="id"
              outlined
              chips
              small-chips
              label="Roles"
              multiple
            ></v-autocomplete>

            <v-btn color="primary" @click="create"> Finish </v-btn>

            <v-btn text @click="dialog.page--"> Previous </v-btn>
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>
    </v-dialog>

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
export default {
  name: "HelloWorld",

  data: () => ({
    list: ["Edit", "Delete"],
    drawer: true,
    toast: {
      color: "error",
      message: "",
      visible: false,
    },
    showCompleted: false,
    loading: false,
    newTask: {
      due: "",
      name: "",
      description: "",
      assignedRoles: [],
      assignedUsers: [],
      priority: "",
      cur: "",
    },
    dialog: {
      active: false,
      page: 1,
      loading: false,
      users: [],
      roles: [],
    },
    tasks: [],
  }),
  mounted: function () {
    this.loading = true;
    this.$http.get("/tasks/@me").then((response) => {
      this.tasks = response.data;
      this.loading = false;
    });
    this.$http.get("/settings/roles").then((response) => {
      this.dialog.roles = response.data.roles;
    });
  },
  computed: {
    gettasks: function () {
      if (this.showCompleted) {
        return this.tasks;
      } else {
        return this.tasks.filter((task) => !task.completed);
      }
    },
  },
  methods: {
    create: async function () {
      this.dialog.loading = true;
      let task = await this.$http.post("/tasks/create", this.newTask);
      this.dialog = {
        active: false,
        page: 1,
        loading: false,
        users: [],
        roles: [],
      };
      this.newTask = {
        due: "",
        name: "",
        description: "",
        assignedRoles: [],
        assignedUsers: [],
        priority: "",
        cur: "",
      };
      this.tasks.push(task.data.task);
      this.toast.message = "Task created!";
      this.toast.color = "success";
      this.toast.visible = true;
    },
    remove: function (item) {
      this.newTask.assignedUsers.splice(this.newTask.assignedUsers.indexOf(item), 1);
    },
    getcur: function () {
      let current = new Date();
      return current.toISOString().substring(0, 10);
    },
    getDate: function (d) {
      let date = new Date(d);

      //get time in date
      let time = date.toLocaleString("en", { weekday: "long" });
      let m = date.toLocaleString("en", { month: "long" });
      let day = date.getDate();
      return `${time} ${m}, ${day}th`;
    },
    completeTask: function (task) {
      this.$http.patch("/tasks/" + task.id).then(() => {
        this.toast.message = "Task completed!";
        task.completed = true
        this.toast.color = "success";
        this.toast.visible = true;
      });
    },
    autoinput: function (input) {
      console.log("woo");
      console.log(input);
      if (!input) return (this.dialog.users = []);
      this.$http.get("/staff/search?keyword=" + input).then((response) => {
        this.dialog.users = response.data.users.map((u) => ({
          ...u,
          selected: false,
        }));
      });
    },

    deleteTask: function (taskId) {
      this.$http.delete("/tasks/" + taskId).then(() => {
        this.toast.message = "Task deleted!";
        this.toast.color = "success";
        this.toast.visible = true;
        this.tasks.splice(this.tasks.findIndex((item) => item.id === taskId), 1);
      });
    }
  },
};
</script>

<style scoped>
.task-card {
  cursor: pointer;
}
</style>

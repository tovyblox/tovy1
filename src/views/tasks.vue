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
          $store.state.user.perms.includes('tasks') ||
          $store.state.user.perms.includes('admin')
        "
        @click="
          // make the dialog active
          dialog.active = true
        "
        ripple
        class=""
      >
        <v-card-title> 📋 Create a notice </v-card-title>
        <v-card-text class="mt-n6">
          Create an inactivity notice for yourself
        </v-card-text>
      </v-card>
      <div v-for="task in tasks" :key="task.id">
        <v-card outlined class="task-card mb-5" min-width="300" ripple>
          <v-row>
            <v-list-item-avatar
              :color="$store.state.group.color"
              class="ml-5 mr-0 mt-4 my-auto"
            >
              <v-img :src="$store.state.user.pfp"></v-img>
            </v-list-item-avatar>
            <v-card-title class="mt-1"> {{ task.name }} </v-card-title>
          </v-row>
          <v-card-text class="mt-n6">
            {{ task.description }}
          </v-card-text>
        </v-card>
      </div>
    </v-container>
    <v-dialog v-model="dialog.active" max-width="600px">
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

            <v-btn text> Cancel </v-btn>
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

            <v-btn color="primary" @click="dialog.page++"> Continue </v-btn>

            <v-btn text @click="dialog.page--"> Previous </v-btn>
          </v-stepper-content>

          <v-stepper-content step="3">
            <v-autocomplete
              v-model="newTask.assignedUsers"
              :items="dialog.users"
              outlined
              cache-items
              chips
              color="blue-grey lighten-2"
              label="Users"
              @update:search-input="(i) => autoinput(i)"
              item-text="username"
              item-value="username"
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
              label="Outlined"
              multiple
            ></v-autocomplete>

            <v-btn color="primary" @click="dialog.page = 1"> Continue </v-btn>

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
    drawer: true,
    toast: {
      color: "error",
      message: "",
      visible: false,
    },
    loading: false,
    newTask: {
      due: "",
      name: "",
      description: "",
      assignedRoles: [],
      assignedUsers: [],
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
    this.$http.get("/tasks/get/all").then((response) => {
      this.tasks = response.data;
      this.loading = false;
    });
    this.$http.get("/settings/roles").then((response) => {
      this.dialog.roles = response.data.roles;
    });
  },

  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    remove: function (item) {
      this.newTask.assignedUsers.splice(this.newTask.assignedUsers.indexOf(item), 1);
    },
    open: function (url) {
      window.open(url);
    },
    getcur: function () {
      let current = new Date();
      return current.toISOString().substring(0, 10);
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
        console.log(this.dialog.users);
      });
    },
    nextPage: function () {
      this.dialog.loading = true;
      if (!this.newTask.due) {
        this.toast.message = "Please select a due date";
        this.toast.color = "error";
        this.toast.visible = true;
        this.dialog.loading = false;
        return;
      }
      this.dialog.page = this.dialog.page + 1;
      this.dialog.loading = false;
    },
  },
};
</script>

<style scoped>
.task-card {
  cursor: pointer;
}
</style>

<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">
          Welcome to Tovy tasks
        </p>
      </v-container>
      <v-btn
        color="success"
        depressed
        class="ml-10 mx-auto"
        v-if="
          $store.state.user.perms.includes('tasks') ||
          $store.state.user.perms.includes('admin')
        "
        @click="
          // make the dialog active
          dialog.active = true
        "
        >Create Task</v-btn
      >
    </v-sheet>

    <v-container class="mt-n16 mx-auto">
      <div v-for="task in tasks" :key="task.id">
        <v-card outlined class="task-card mb-5" min-width="300" ripple>
          <v-row>
            <v-list-item-avatar
              :color="$store.state.group.color"
              class="ml-5 mr-0 mt-4 my-auto"
            >
              <v-img :src="task.creatorAvatar"></v-img>
            </v-list-item-avatar>
            <v-card-title class="mt-1"> {{ task.name }} </v-card-title>
          </v-row>
          <v-card-text class="mt-n6">
            {{ task.description }}
          </v-card-text>
        </v-card>
      </div>
    </v-container>
    <v-dialog
      v-model="dialog.active"
      max-width="600px"
      @input="(v) => v || resetD()"
    >
      <v-progress-linear
        indeterminate
        v-if="dialog.loading"
        :color="$store.state.group.color"
      ></v-progress-linear>
      <v-card v-if="dialog.page == 1">
        <v-card-title class="headline">Select a Due Date</v-card-title>
        <v-date-picker
          :min="getcur()"
          class="mb-3"
          dark
          full-width
          :color="$store.state.group.color"
          v-model="newTask.due"
        ></v-date-picker>
                  <v-card-actions>

        <v-btn class="mb-3" color="primary" @click="nextPage()" block
          >Next</v-btn
        >
        </v-card-actions>
      </v-card>
      <v-card v-if="dialog.page == 2">
        <v-card-title>Now Lets Get Some Details</v-card-title>
        <v-text-field
          :color="$store.state.group.color"
          label="Task Name"
          v-model="newTask.name"
          required
          :rules="[(v) => !!v || 'Name is required']"
          class="mb-3 mx-2"
        ></v-text-field>
        <v-textarea
          :color="$store.state.group.color"
          label="Task Description"
          :rules="[(v) => !!v || 'Description is required']"
          v-model="newTask.description"
          required
          class="mb-3 mx-2"
          hide-details="auto"
        ></v-textarea>
                  <v-card-actions>

        <v-row class="mx-auto mt-auto mb-auto">
                 <v-btn class="mb-3" color="primary" @click="nextPage()" block
            >Next</v-btn
          >
          <v-btn class="mb-1" color="primary" @click="previousPage()" block
            >Previous</v-btn>
   
        </v-row>
        </v-card-actions>
      </v-card>
      <v-card v-if="dialog.page == 3">
        <v-card-title>Assign to users</v-card-title>
        <v-text-field
          :color="$store.state.group.color"
          label="Assign to"
          v-model="newTask.cur"
          required 
          class="mb-3 mx-4 mb-0"
        ></v-text-field>
                  <v-card-actions>

        <v-row class="mx-auto mt-0 mb-auto">
                            <v-btn class="mb-6" color="primary" @click="addUser()" block
            >Assign User</v-btn
          >
                 <v-btn class="mb-3" color="primary" @click="nextPage()" block
            >Review Assigned Users</v-btn
          >
          <v-btn class="mb-1" color="primary" @click="previousPage()" block
            >Previous</v-btn>
   
        </v-row>
      </v-card-actions>
      </v-card>
      <v-card
      v-if="dialog.page == 4"
      >
      <v-card-title>Review Assigned Users</v-card-title>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="toast.visible">
      {{ toast.message }}

      <template v-slot:action="{ attrs }">
        <v-btn
          :color="toast.color"
          text
          v-bind="attrs"
          @click="toast.visible = false"
        >
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
    groups: "dog",
    newTask: {
      due: "",
      name: "",
      description: "",
      creator: "",
      creatorAvatar: "",
      assignedRoles: [],
      assignedUsers: [],
      cur: "",
    },
    update: {},
    dialog: {
      active: false,
      page: 1,
      loading: false,
    },
    tasks: [],
  }),
  mounted: function () {
    this.loading = true;
    this.$http.get("/tasks/get/all").then((response) => {
      this.tasks = response.data;
      console.log(this.tasks);
      this.loading = false;
      this.newTask.creator = this.$store.state.user.id;
      this.$http
        .get("/pfp/id/" + this.$store.state.user.id)
        .then((response) => {
          this.newTask.creatorAvatar = response.data.pfp;
        });
    });
  },

  methods: {
    resetD: function () {
      setTimeout(() => {
        this.dialog.page = 1;
      }, "500");
      this.dialog.loading = false;
      this.newTask.due = "";
      this.newTask.name = "";
      this.newTask.description = "";
    },
    addUser: function () {
      this.newTask.assignedUsers.push(this.newTask.cur);
      this.toast.message = "Successfully assigned this task to " + this.newTask.cur;
      this.toast.color = "success";
      this.toast.visible = true;
      this.newTask.cur = "";
    },
    goto: function (url) {
      this.$router.push(url);
    },
    open: function (url) {
      window.open(url);
    },
    getPfp: async function (user) {
      const data = await this.$http.get("/pfp/id/" + user);
      return data.data.pfp.toString();
    },
    getcur: function () {
      let current = new Date();
      return current.toISOString().substring(0, 10);
    },
    previousPage: function () {
      this.dialog.page = this.dialog.page - 1;
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

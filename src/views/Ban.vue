<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">Welcome to banning</p>
      </v-container>
    </v-sheet>
    <v-container class="mt-n16 mx-auto">
      <!-- omg that was... gross -->
      <v-card outlined>
        <v-card-text> Search user </v-card-text>
        <div class="mx-4">
          <v-form>
            <v-text-field
              hide-details="auto"
              v-model="username"
              outlined
              label="Username"
            />
            <v-textarea
              class="mt-2"
              hide-details="auto"
              v-model="reason"
              label="Reason"
              outlined
            />
            <v-btn
              class="mt-2"
              color="primary"
              v-bind:disabled="perm == true"
              @click.stop="dialog.active = true"
              block
              >Select end date</v-btn
            >
            <v-dialog v-model="dialog.active" max-width="600px">
              <v-card>
                <v-date-picker
                  :min="getcur()"
                  class="mb-3"
                  dark
                  full-width
                  color="blue"
                  v-model="date"
                ></v-date-picker>
                <v-btn
                  class="mb-8"
                  color="primary"
                  @click.stop="dialog.active = false"
                  block
                  >Submit</v-btn
                >
              </v-card>
            </v-dialog>
          </v-form>
          <v-checkbox v-model="perm" class="mt-2" :label="`Permanent Ban`"></v-checkbox>
          <v-row class="mx-auto mb-auto ml-auto">
            <v-btn @click="ban()" text color="success" class="ml-auto mb-2">
              Create ban
            </v-btn>
          </v-row>
        </div>
      </v-card>
    </v-container>
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
  name: "Ban",
  data: () => ({
    drawer: true,
    loading: false,
    toast: {
      message: "",
      color: "success",
      visible: false,
    },
    groups: "dog",
    username: "",
    perm: false,
    reason: "",
    date: "",
    dialog: {
      active: false,
      loading: false,
      valid: false,
    },
    time: "",
    user: { picture: "", name: "", id: "" },
  }),
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    look() {
      this.$http.get("/getuser/" + this.username).then((response) => {
        this.user.id = response.data.user.userid;
        this.goto("/profile/" + this.user.id);
      });
    },
    getcur: function () {
      let current = new Date();
      return current.toISOString().substring(0, 10);
    },
    ban() {
      if (!this.date && !this.perm) {
        this.toast.message = "Please select a date";
        this.toast.color = "error";
        this.toast.visible = true;
        return;
      }
      if (!this.reason) {
        this.toast.message = "Please enter a reason";
        this.toast.color = "error";
        this.toast.visible = true;
        return;
      }
      this.dialog.loading = true;
      if (!this.username) {
        this.toast.message = "Please enter a username";
        this.toast.color = "error";
        this.toast.visible = true;
        this.dialog.loading = false;
        return;
      }
      if (this.perm) {
        this.date = null;
      }
      if (this.perm == null) {
        this.perm = false;
      }
      this.loading = true;
      this.$http
        .post("/bans/ban", {
          username: this.username,
          reason: this.reason,
          until: this.date,
          perm: this.perm ?? false,
          bannedBy: this.$store.state.user.id,
        })
        .then((res) => {
          this.loading = false;
          this.dialog.active = false;
          this.reason = "";
          this.date = "";
          if (res.data.success) {
            this.toast.message = `Successfully banned ${this.username}!`;
            this.toast.visible = true;
          } else {
            this.toast.message = `Failed to ban ${this.username}!`;
            this.toast.visible = true;
            this.toast.color = "error";
          }
          this.username = "";
        });
    },
  },
};
</script>

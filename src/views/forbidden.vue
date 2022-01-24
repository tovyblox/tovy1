<template>
  <div style="height: 100%">
    <v-sheet color="grey lighten-2" height="200" style="width: 100%"> </v-sheet>
    <v-container class="mt-n10 mx-auto">
      <v-card min-width="200px" max-width="600px" outlined class="mt-n3 mx-auto">
        <v-card-title class="mb-n6"> No permissions! </v-card-title>
        <v-card-text class="mt-n4">
          Looks like you dont have permission to use Tovy in this group!
        </v-card-text>
        <v-img src="../assets/no-perms.png" class="mx-auto mt-7" max-width="400"></v-img>
        <v-row class="mb-3">
          <v-btn @click="dialog.active = true" class="mx-auto mb-4 info">
            I have an invite code
          </v-btn>
        </v-row>
        <v-row justify="center">
          <v-dialog v-model="dialog.active" max-width="600px">
            <v-card>
              <v-card-title>Invite code </v-card-title>
              <v-card-text class="mt-n5">Enter please </v-card-text>
              <v-alert
                type="error"
                v-if="dialog.incorrect"
                class="mt-n3 mx-6 mb-6"
                color="red"
              >
                Invalid invite code
              </v-alert>
              <v-form
                ref="form"
                class="mt-n3 mx-6"
                v-model="dialog.valid"
                lazy-validation
              >
                <v-progress-linear
                  v-if="dialog.loading"
                  indeterminate
                  class="mb-3 rounded-xl"
                >
                </v-progress-linear>

                <v-text-field
                  outlined
                  v-model="code"
                  hide-details="auto"
                  label="Code"
                  :prefix="`${host}/invite/`"
                  required
                  class="mb-3"
                  :rules="[(v) => !!v || 'Username is required']"
                ></v-text-field>
                <v-btn elevation="0" @click="sendinvite" class="mb-4 ml-auto" color="success"> Submit </v-btn>
                <v-btn
                  elevation="0"
                  class="mb-4 ml-auto float-right"
                  @click="dialog.active = false"
                  plain
                  color="info"
                >
                  Cancel
                </v-btn>
              </v-form>
            </v-card>
          </v-dialog>
        </v-row>
      </v-card>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "Welcome",
  data: () => ({
    e1: 1,
    code: "",
    valid: true,
    host: location.host,
    dialog: {
      active: false,
      loading: false,
      incorrect: false,
      valid: true,
    },
  }),
  methods: {
    sendinvite: function () {
      this.dialog.loading = true;
      this.$http.post("/invite", { code: this.code }, { withCredentials: true }).then(
        () => {
          this.$http.get("/profile", { withCredentials: true }).then((response) => {
            if (!response) return;
            response.data.info.pfp = response.data.pfp;
            this.$store.commit("setuser", response.data.info);
            this.$store.commit("setgroup", response.data.group);

            setTimeout(() => {
              this.$router.push("/");
            }, 1000);
          });
        },
        () => {
          this.dialog.incorrect = true;
          this.dialog.loading = false;
        }
      );
    },
  },
};
</script>

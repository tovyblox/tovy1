<template>
  <div style="height: 100%">
    <v-sheet color="grey lighten-2" height="200" style="width: 100%"> </v-sheet>
    <v-container class="mt-n10 mx-auto">
      <v-card min-width="200px" max-width="600px" outlined class="mt-n3 mx-auto">
        <v-card-title class="mb-n5"> Lets get started! </v-card-title>
        <v-stepper elevation="0" v-model="e1">
          <v-stepper-items>
            <v-stepper-content class="mx-n2 mt-n6" step="1">
              <v-card-text class="mt-n5 ml-n4 mt-n2 mt-n2 grey--text">
                Lets start with your login info
              </v-card-text>
              <v-form ref="form" v-model="valid" lazy-validation>
                <v-text-field
                  outlined
                  v-model="username"
                  label="Roblox username"
                  required
                  :rules="[(v) => !!v || 'Username is required']"
                ></v-text-field>
                <v-text-field
                  v-model="password"
                  outlined
                  label="Password"
                  class="mt-n3"
                  :rules="[(v) => !!v || 'Password is required']"
                  type="password"
                ></v-text-field>
                <v-btn elevation="0" class="mt-n4 ml-auto" @click="next" color="success">
                  Next
                </v-btn>
              </v-form>
            </v-stepper-content>
            <v-stepper-content class="mx-n2 mt-n6" step="2">
              <v-card-text class="mt-n5 ml-n4 mt-n2 mt-n2 grey--text">
                Next some info about your group
              </v-card-text>
              <v-form ref="frm" v-model="valid" lazy-validation>
                <v-text-field
                  outlined
                  v-model="group"
                  label="Group ID"
                  :rules="[(v) => !!v || 'Group ID is required']"
                ></v-text-field>
                <v-text-field
                  v-model="name"
                  outlined
                  label="Name"
                  class="mt-n3"
                ></v-text-field>

                <v-btn elevation="0" class="mt-n4 ml-auto" @click="e1 = 1" plain>
                  Back
                </v-btn>
                <v-btn
                  elevation="0"
                  class="mt-n4 float-right"
                  @click="dog()"
                  color="success"
                >
                  Done
                </v-btn>
              </v-form>
            </v-stepper-content>
            <v-stepper-content class="mx-n2 mt-n6" step="3">
              <v-card-text class="mt-n5 ml-n4 mt-n2 mt-n2 grey--text">
                Boom!
              </v-card-text>
              <v-row class="mx-auto mb-5 mt-5">
                <v-progress-circular
                  :size="50"
                  color="amber"
                  class="mx-auto"
                  indeterminate
                ></v-progress-circular>
                <v-card-text class="text-center mt-2 mb-n5">
                  Finishing up setup...
                </v-card-text>
              </v-row>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-card>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "Welcome",
  data: () => ({
    e1: 1,
    username: "",
    password: "",
    valid: true,
    group: "",
    name: "",
  }),
  methods: {
    next: function () {
      this.$refs.form.validate();
      setTimeout(() => {
        if (!this.valid) return;
        this.e1++;
      }, 500);
    },
    dog() {
      this.e1 = 3;
      this.$refs.frm.validate();
      if (!this.valid) return;
      this.$http
        .post(
          "/finishSignup",
          {
            username: this.username,
            password: this.password,
            group: this.group,
          },
          { withCredentials: true }
        )
        .then(() => {
          this.$http.get("/profile", { withCredentials: true }).then((response) => {
            if (!response) return;
            response.data.info.pfp = response.data.pfp;
            this.$store.commit("setuser", response.data.info);
            this.$store.commit("setgroup", response.data.group);
            setTimeout(() => {
              this.$router.push("/");
            }, 3000);
          });
        });
    },
  },
};
</script>

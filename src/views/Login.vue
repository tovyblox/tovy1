<template>
  <div style="height: 100%">
    <v-sheet color="grey lighten-2" height="200" style="width: 100%"> </v-sheet>
    <v-container class="mt-n10 mx-auto">
      <v-card min-width="200px" max-width="600px" outlined class="mt-n3 mx-auto">
        <v-card-title class="mb-n5"> Login! </v-card-title>
        <v-stepper elevation="0" v-model="e1">
          <v-stepper-items>
            <v-stepper-content class="mx-n2 mt-n6" step="1">
              <v-card-text class="mt-n5 ml-n4 mt-n2 mt-n2 grey--text">
                Login to tovy with your tovy credentials
              </v-card-text>
              <v-alert type="error" v-if="error" class="mt-n2" color="red">
                We could not find an account with that username and password</v-alert
              >
              <v-form ref="form" v-model="valid" lazy-validation>
                <v-text-field
                  outlined
                  v-model="username"
                  label="Roblox username"
                  hide-details="auto"
                  required
                  :rules="[(v) => !!v || 'Username is required']"
                ></v-text-field>
                <v-text-field
                  v-model="password"
                  outlined
                  label="Password (not roblox password)"
                  hint="Not your roblox password, the password for this site"
                  class="mt-3"
                  hide-details="auto"
                  :rules="[(v) => !!v || 'Password is required']"
                  type="password"
                ></v-text-field>
                <v-btn elevation="0" class="mt-3 ml-auto" @click="dog" color="success">
                  Login
                </v-btn>
                 <v-btn elevation="0" class="ml-3 mt-3" plain @click="signup" color="info">
                  Sign UP
                </v-btn>
              </v-form>
            </v-stepper-content>
            <v-stepper-content class="mx-n2 mt-n6" step="2">
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
                <v-card-text class="text-center mt-2 mb-n5"> Logging you in </v-card-text>
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
    error: false,
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
    }, signup: function () {
      this.$router.push(`/signup${this.$route.query.invite ? `?invite=${this.$route.query.invite}` : ''}`);
    },
    dog() {
      this.e1 = 2;
      this.$refs.form.validate();
      if (!this.valid) return;
      this.$http
        .post(
          "/login",
          {
            username: this.username,
            password: this.password,
            group: this.group,
          },
          { withCredentials: true }
        )
        .catch(() => {
          this.error = true;
          setTimeout(() => {
            this.e1 = 1;
          }, 500);
          return;
        })
        .then((res) => {
          if (!res) return;
          this.$http.get("/profile", { withCredentials: true }).then((response) => {
            if (!response) return;
            response.data.info.pfp = response.data.pfp;
            this.$store.commit("setuser", response.data.info);
            this.$store.commit("setgroup", response.data.group);

            setTimeout(() => {
              this.$router.push("/");
            }, 1000);
          });
        });
    },
  },
};
</script>

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
                Let's start with your login info
              </v-card-text>
              <v-alert type="error" v-if="error" class="mt-n2" color="red">
                Please enter a valid username</v-alert
              >
              <v-progress-linear v-if="loading" indeterminate class="mb-3 rounded-xl">
              </v-progress-linear>
              <v-form ref="form" v-model="valid" lazy-validation>
                <v-text-field
                  outlined
                  v-model="username"
                  :disabled="loading"
                  @input="error = false"
                  label="Roblox username"
                  required
                  :rules="[(v) => !!v || 'Username is required']"
                ></v-text-field>
                <v-btn elevation="0" class="mt-n4 ml-auto" @click="next" color="success">
                  Next
                </v-btn>
              </v-form>
            </v-stepper-content>
            <v-stepper-content class="mx-n2 mt-n6" step="2">
              <v-card-text class="mt-n5 ml-n4 mt-n2 mt-n2 grey--text">
                Now lets verify its actually you and not some sussy inpasta
              </v-card-text>
               <v-alert type="error" v-if="error" class="mt-n2" color="red">
                I could not find the code in your profile </v-alert
              >
              <v-progress-linear v-if="loading" indeterminate class="mb-3 rounded-xl"/>
              <h3 class="text-center">Please paste the below into your Roblox blurb</h3>
              <div class="text-h5 mb-10 text-center">
                <code> {{ vstring }} </code>
              </div>

              <v-btn color="primary" @click="verify" elevation="0"> Done </v-btn>
              <v-btn class="float-right" @click="e1 = 1" text> Back </v-btn>
            </v-stepper-content>
            <v-stepper-content class="mx-n2 mt-n6" step="3">
              <v-card-text class="mt-n5 ml-n4 mt-n2 mt-n2 grey--text">
                Finish signup
              </v-card-text>
              <v-form ref="frm" v-model="valid" lazy-validation>
                <v-text-field
                  outlined
                  v-model="password"
                  :disabled="loading"
                  @input="error = false"
                  hide-details="auto"
                  type="password"
                  label="Password"
                  required
                  :rules="[(v) => !!v || 'Password required']"
                ></v-text-field>
                 <v-text-field
                  outlined
                  :disabled="loading"
                  @input="error = false"
                  type="password"
                  class="mt-2"
                  hide-details="auto"
                  label="Confirm password"
                  required
                  :rules="[(v) => v === password || 'Password don\'t match']"
                ></v-text-field>
                <v-btn elevation="0" class="mt-2 ml-auto" @click="dog" color="success">
                  Next
                </v-btn>
              </v-form>
            </v-stepper-content>
            <v-stepper-content class="mx-n2 mt-n6" step="4">
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
                  Signing you up...
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
  name: "Signup",
  data: () => ({
    e1: 1,
    username: "",
    password: '',
    valid: true,
    vstring: "",
    error: false,
    loading: false,
  }),
  methods: {
    next: function () {
      this.$refs.form.validate();
      if (!this.valid) return;
      this.loading = true;
      this.$http.post("/signup/start", { username: this.username }, { withCredentials: true }).then(
        (res) => {
          res;
          this.loading = false;
          this.e1 = 2;
          this.vstring = res.data.string;
        },
        (err) => {
          err;
          this.error = true;
          this.loading = false;
        }
      );
    }, verify: function () {
      this.loading = true
      this.$http.post("/signup/verify", { }, { withCredentials: true }).then(
        (res) => {
          res;
          this.e1 = 3;
          this.loading = false;
        },
        (err) => {
          err;
          this.error = true;
          this.loading = false;
        }
      );
    },
    dog() {
      this.e1 = 4;
      this.$refs.frm.validate();
      if (!this.valid) return;
      this.$http
        .post(
          "/signup/finish",
          {
            username: this.username,
            password: this.password, 
            invite: this.$route.query.invite || undefined
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
          }, (err) => {
            if (err.response.status == 403) {
              this.$router.push('/forbidden')
            }
          });
        });
    },
  },
};
</script>

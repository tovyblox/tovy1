<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">Welcome to your home</p>
      </v-container>
    </v-sheet>
    <v-container class="mt-n16 mx-auto">
      <v-card @click="prompt.active = true" min-width="300" ripple class="mb-5">
        <v-card-title> 📋 Host a session </v-card-title>
        <v-card-text class="mt-n6"> UWU </v-card-text>
      </v-card>
      <v-card ripple min-width="300" height="auto" class="mb-n6" outlined>
        <v-img
          max-height="100"
          height="78"
          gradient="to bottom, rgba(255,255,255,0.3), rgba(255,255,255,1)"
          class="py-auto"
          :src="`https://tr.rbxcdn.com/0322ebe1e26eca7f692972aea1fe80ea/768/432/Image/Png`"
        >
          <v-layout>
            <div @click="goto('/session/12')">
              <v-card-title class="my-auto"> Training session </v-card-title>
              <v-card-text class="mt-n6">
                WHOOOP is hosting a training @ Impieral Hotels and Resorts
              </v-card-text>
            </div>
            <v-spacer @click="goto('/session/12')" />
            <v-btn class="my-auto mr-2" plain color="success">
              Play <v-icon right dark> mdi-arrow-right </v-icon>
            </v-btn>
          </v-layout>
        </v-img>
      </v-card>
    </v-container>

    <v-row justify="center">
      <v-dialog v-model="prompt.active" max-width="600px">
        <v-card :loading="prompt.loading">
          <v-card-title>Host session </v-card-title>
          <v-card-text class="mt-n5">Host a session for our group! </v-card-text>
          <p class="ml-6 mt-n3">What kind of session is this?</p>
          <v-select
            outlined
            label="Select session"
            item-text="type"
            item-value="id"
            class="mx-6 mt-n2"
            v-model="prompt.game"
            :items="games"
          >
          </v-select>

          <p class="ml-6 mt-n5">When are you hosting your session?</p>
          <v-radio-group class="mx-6 mb-3 mt-n2" v-model="prompt.now">
            <v-radio :value="true" label="Now"></v-radio>
            <v-radio :value="false" label="Later"></v-radio>
          </v-radio-group>
          <v-form
            ref="form"
            v-if="!prompt.now"
            class="mt-n3 mx-6"
            v-model="prompt.valid"
            lazy-validation
          >
            <v-date-picker
              :min="getcur()"
              class="mb-3"
              dark
              full-width
              color="blue"
              landscape
              v-model="prompt.date"
            ></v-date-picker>

            <v-time-picker
              landscape
              full-width
              class="rounded mb-3"
              type="month"
              v-model="prompt.time"
            ></v-time-picker>

            <v-alert
              type="error"
              v-if="!prompt.now && (!prompt.date || !prompt.time)"
              class="mb-6"
              color="red"
            >
              Time and date are required</v-alert
            >
          </v-form>
          <div class="mx-6">
            <v-btn elevation="0" class="mb-4 ml-auto" @click="submit" color="success">
              Submit
            </v-btn>
            <v-btn
              elevation="0"
              class="mb-4 ml-auto float-right"
              @click="prompt.active = false"
              plain
              color="info"
            >
              Cancel
            </v-btn>
          </div>
        </v-card>
      </v-dialog>
    </v-row>
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
    loading: false,
    groups: "dog",
    toast: {
      message: "",
      color: "success",
      visible: false,
    }, 
    prompt: {
      date: "",
      game: 0,
      active: false,
      now: false,
      valid: true,
      time: "12:00",
      loading: false,
    },
    games: [],
  }),
  mounted() {
    this.$http.get("/games").then((res) => {
      this.games = res.data;
    });
  },
  components: {},
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    settime: function (v) {
      console.log(v);
    },
    submit: function () {
      this.prompt.loading = true;
      console.log(this.prompt);
      let ds = this.prompt.date.split("-");
      let newdate = new Date(ds.join(" "));
      newdate.setHours(this.prompt.time.split(":")[0], this.prompt.time.split(":")[1]);
      console.log(newdate);

      this.$http
        .post("/hostsession", {
          ...this.prompt,
          date: newdate,
        })
        .then(() => {
          console.log("cteated");
          this.prompt.loading = false;
          this.prompt.active = false;

          this.toast = {
            message: "Session created!",
            color: "success",
            visible: true,
          }
        })
        .catch(() => {
          this.prompt.loading = false;
          this.prompt.active = false;
          console.log("error");
          this.toast = {
            message: "Session not created!",
            color: "error",
            visible: true,
          }
        });
    },
    getcur: function () {
      let current = new Date();
      return current.toISOString().substring(0, 10);
    },
    open: function (url) {
      window.open(url);
    },
  },
};
</script>

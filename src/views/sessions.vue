<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">Welcome to sessions</p>
      </v-container>
    </v-sheet>
    <v-container v-if="enabled" class="mt-n16 mx-auto">
      <v-card v-if="$store.state.user.perms.includes('host_sessions')" @click="prompt.active = true" min-width="300" ripple class="mb-5">
        <v-card-title> 📋 Host a session </v-card-title>
        <v-card-text class="mt-n6"> Host a session with ease in two clicks </v-card-text>
      </v-card>
      <v-card outlined v-if="!sessions.length">
        <v-row class="mx-auto mb-5 mt-5">
          <v-img
            src="../assets/experimental-sleepy-tiger-coming-out-of-the-cave-in-the-morning.png"
            class="mx-auto mt-7"
            max-width="400"
          ></v-img>
          <v-card-text class="text-center mt-n5 mb-n4">
            There are no sessions planned or ongoing
          </v-card-text>
        </v-row></v-card
      >
      <v-card
        v-for="(session, i) in sessions"
        :key="i"
        ripple
        min-width="300"
        height="auto"
        class="mb-2"
        :style="`background-image: linear-gradient(rgba(255, 255, 255, 0.3), rgb(255, 255, 255)), url(${session.thumbnail});  background-position: center center; background-size: cover;`"
        outlined
      >
        <v-layout>
          <div @click="goto(`/session/${session.id}`)">
            <v-card-title class="my-auto">
              {{ session.started ? `🟢 ${session.type.name}` : session.type.name }}
            </v-card-title>
            <v-card-text class="mt-n6">
              {{ session.user.username }} is hosting a {{ session.type.name}} @
              {{ session.type.gname }}.
              <countdown
                v-if="!session.started"
                @end="started(session)"
                :time="gettime(session)"
              >
                <template slot-scope="props"
                  >Starts in {{ props.days }} days, {{ props.hours }} hours,
                  {{ props.minutes }} minutes, {{ props.seconds }} seconds.</template
                >
              </countdown>
            </v-card-text>
          </div>
          <v-spacer @click="goto(`/session/${session.id}`)" />
          <v-btn @click="play(session)" class="my-auto mr-2" plain color="success">
            Play <v-icon right dark> mdi-arrow-right </v-icon>
          </v-btn>
        </v-layout>
      </v-card>
    </v-container>

    <v-container v-if="!enabled" class="mt-n16 mx-auto">
      <v-card outlined>
        <v-row class="mx-auto mb-5 mt-5">
          <v-img
            src="../assets/experimental-sleepy-tiger-coming-out-of-the-cave-in-the-morning.png"
            class="mx-auto mt-7"
            max-width="400"
          ></v-img>
          <v-card-text class="text-center mt-n5 mb-n4">
            Sadly this module isnt enabled!
          </v-card-text>
        </v-row></v-card
      >
    </v-container>

    <v-row justify="center">
      <v-dialog v-model="prompt.active" max-width="600px">
        <v-card :loading="prompt.loading">
          <v-card-title>Host session </v-card-title>
          <v-card-text class="mt-n5">Host a session for our group! </v-card-text>

          <p class="ml-6 mt-n5">When are you hosting your session?</p>
          <v-radio-group class="mx-6 mb-3 mt-n2" v-model="prompt.now">
            <v-radio :value="true" label="Now"></v-radio>
            <v-radio :value="false" label="Later"></v-radio>
          </v-radio-group>
          <v-form ref="form" class="mt-n3 mx-6" v-model="prompt.valid" lazy-validation>
            <p class="mt-n3">What kind of session is this?</p>
            <v-select
              outlined
              label="Select session"
              item-text="type"
              required
              :rules="[(v) => !!v || 'Please select a session type']"
              item-value="id"
              class="mt-n2"
              v-model="prompt.game"
              :items="games"
            >
            </v-select>
            <v-date-picker
              :min="getcur()"
              class="mb-3"
              v-if="!prompt.now"
              dark
              full-width
              color="blue"
              landscape
              v-model="prompt.date"
            ></v-date-picker>

            <v-time-picker
              landscape
              full-width
              v-if="!prompt.now"
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
            <v-btn
              elevation="0"
              class="mb-4 ml-auto"
              :disabled="(!prompt.now && (!prompt.date || !prompt.time)) || !prompt.valid"
              @click="submit"
              color="success"
            >
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
    sessions: [],
    prompt: {
      date: "",
      game: 0,
      active: false,
      now: true,
      valid: true,
      time: "12:00",
      loading: false,
    },
    enabled: true,
    games: [],
  }),
  mounted() {
    this.$http.get("/games").then((res) => {
      this.games = res.data;
    });

    this.$http.get("/sessions").then((res) => {
      this.sessions = res.data.filter((session) => !session.end);
    }).catch(() => {
      this.enabled = false
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
    play: function (session) {
      console.log(session.type.gid);
      window.open(`https://www.roblox.com/games/${session.type.gid}/-`);
    },
    gettime: function (session) {
      const now = new Date().getTime();
      const start = new Date(session.start).getTime();
      console.log(start);
      const distance = start - now;

      if (distance < 0) {
        session.started = true;
        return 0;
      }

      return distance;
    },
    started: function (session) {
      session.started = true;
    },
    submit: function () {
      this.prompt.loading = true;
      this.$refs.form.validate();
      console.log(this.prompt.valid);
      setTimeout(() => {
        if (!this.prompt.valid) {
          this.prompt.loading = false;
          return;
        }
        console.log(this.prompt);
        let ds = this.prompt.date.split("-");
        let newdate = new Date(ds.join(" "));
        newdate.setHours(this.prompt.time.split(":")[0], this.prompt.time.split(":")[1]);
        console.log(this.prompt.game);

        this.$http
          .post("/hostsession", {
            ...this.prompt,
            type: this.prompt.game,
            date: newdate,
          })
          .then((res) => {
            console.log("cteated");
            this.prompt.loading = false;
            this.prompt.active = false;
            this.sessions.push(res.data);

            this.toast = {
              message: "Session created!",
              color: "success",
              visible: true,
            };
          })
          .catch(() => {
            this.prompt.loading = false;
            this.prompt.active = false;
            console.log("error");
            this.toast = {
              message: "Session not created!",
              color: "error",
              visible: true,
            };
          });
      }, 200);
    },
    getcur: function () {
      let current = new Date();
      console.log(`${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`)
      return `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate()}`;
    },
    open: function (url) {
      window.open(url);
    },
  },
};
</script>

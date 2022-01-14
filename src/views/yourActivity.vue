<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">Here is your activity for the week</p>
      </v-container>
    </v-sheet>
    <v-container class="mt-n16 mx-auto">
      <v-card min-width="300" @click.stop="dialog.active = true" ripple class="">
        <v-card-title> 📋 Create a notice </v-card-title>
        <v-card-text class="mt-n6">
          Create an inactivity notice for yourself
        </v-card-text>
      </v-card>

      <v-card
        min-width="300"
        v-for="session in data"
        :key="session.start"
        outlined
        class="mt-3 py-n1"
      >
        <v-layout>
          <div>
            <v-card-title v-if="session.type == 'session'" class="mt-n1">
              ➕ Time in-game
            </v-card-title>
            <v-card-title v-if="session.type == 'IA'" class="mt-n1">
              ⏱ Inactivity Notice
            </v-card-title>

            <v-card-text
              v-if="session.type == 'session'"
              class="grey--text text--darken-1 mt-n6 mb-n1"
            >
              You spent {{ getTimeRange(session.start, session.end) }} ingame from
              {{ getTime(session.start) }} to {{ getTime(session.end) }} on
              {{ getDate(session.start) }}
            </v-card-text>
            <v-card-text
              v-if="session.type == 'IA'"
              class="mt-n6 mb-n1 grey--text text--darken-1"
            >
              You have an inactivity notice
              {{ getDate(session.start) }} to {{ getDate(session.end) }} for {{ session.reason }}
            </v-card-text>
          </div>
          <v-spacer></v-spacer>
          <div class="my-auto" v-if="session.type == 'IA'">
            <v-card-title
              v-if="session.status == 'none'"
              style="min-width: 100px"
              class="grey--text text--darken-1 float-right"
              >Processing</v-card-title
            >

            <v-card-title
              v-if="session.status == 'denied'"
              style="min-width: 100px"
              class="red--text my-auto float-right"
              >Denied</v-card-title
            >

             <v-card-title
              v-if="session.status == 'accepted'"
              style="min-width: 130px"
              class="green--text my-auto float-right"
              >Accepted</v-card-title
            >
          </div>
        </v-layout>
      </v-card>
    </v-container>
    <v-row justify="center">
      <v-dialog v-model="dialog.active" max-width="600px">
        <v-card>
          <v-card-title>New notice </v-card-title>
          <v-card-text class="mt-n5"
            >{{ this.$store.state.group.noticetext || 'No notice policy' }}
          </v-card-text>
          <v-alert
            type="error"
            v-if="dates.length <= 1"
            class="mt-n3 mx-6 mb-6"
            color="red"
          >
            Dates for your IA are required</v-alert
          >
          <v-form ref="form" class="mt-n3 mx-6" v-model="dialog.valid" lazy-validation>
            <v-progress-linear
              v-if="dialog.loading"
              indeterminate
              class="mb-3 rounded-xl"
            >
            </v-progress-linear>

            <v-text-field
              outlined
              v-model="reason"
              hide-details="auto"
              label="Reason"
              prefix="I'm inactive for"
              required
              class="mb-3"
              :rules="[(v) => !!v || 'Username is required']"
            ></v-text-field>
            <v-date-picker
              :min="getcur()"
              class="mb-3"
              dark
              full-width
              color="blue"
              v-model="dates"
              range
            ></v-date-picker>
            <v-btn elevation="0" class="mb-4 ml-auto" @click="dog" color="success">
              Submit
            </v-btn>
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
  </div>
</template>

<script>
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: { active: false, loading: false },
    loading: false,
    dates: [],
    reason: null,

    dialog: { active: false, loading: false, valid: false },
    data: [],
    groups: "dog",
  }),
  components: {},
  mounted: function () {
    this.$http.get("/activity/@me", { withCredentials: true }).then((response) => {
      this.data = response.data.sessions.sort((a, b) => {
        return new Date(b.end).getTime() - new Date(a.end).getTime();
      });
    });
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    dog() {
      this.dialog.loading = true;
      this.$refs.form.validate();
      if (!this.dialog.valid) return;
      if (this.dates.length <= 1) return;
      this.$http
        .post(
          "/createia",
          {
            date: this.dates,
            r: this.reason,
          },
          { withCredentials: true }
        )
        .then((req) => {
          req.data.data.type = "IA";

          this.data.unshift(req.data.data);
          this.dialog.loading = false;
          this.dialog.active = false;
          this.dates = [];
          this.reason = null;
        });
    },
    getTime: function (d) {
      let date = new Date(d);
      //get time in date
      let time = date.getMinutes();
      let hour = date.getHours();
      return `${hour}:${time}`;
    },
    getDate: function (d) {
      let date = new Date(d);

      //get time in date
      let time = date.toLocaleString("en", { weekday: "long" });
      let m = date.toLocaleString("en", { month: "long" });
      let day = date.getDate();
      return `${time} ${m}, ${day}th`;
    },
    getcur: function () {
      let current = new Date();
      return current.toISOString().substring(0, 10);
    },
    getTimeRange: function (d, d2) {
      let date = new Date(d);
      let date2 = new Date(d2);
      //get time in date
      let time = date.getMinutes();
      let hour = date.getHours();

      let time2 = date2.getMinutes();
      let hour2 = date2.getHours();
      if (hour2 - hour == 0) {
        return `${time2 - time} minutes`;
      } else {
        return `${hour2 - hour} hour, ${time2 - time} minutes`;
      }
    },
  },
};
</script>

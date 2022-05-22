<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">
          Lets view some inactivity notices
        </p>
      </v-container>
    </v-sheet>
    <v-container class="mt-n16 mx-auto">
    <v-card min-width="300" v-if="!data.length" class="">
        <v-card-title> 📋 No notices to view </v-card-title>
        <v-card-text class="mt-n6">
          No inactivity notices to view
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
            <v-card-title class="mt-n1">
              {{ session.username }}'s inactivity notice
            </v-card-title>

            <v-card-text class="mt-n6 mb-n1 grey--text text--darken-1">
              from
              {{ getDate(session.start) }} to {{ getDate(session.end) }} for
              {{ session.reason }}
            </v-card-text>
          </div>
          <v-spacer></v-spacer>
          <v-btn class="my-auto mr-2" @click="deny(session.id)" color="error" plain> Deny </v-btn>
          <v-btn class="my-auto mr-2" @click="accept(session.id)" color="success" plain> Accept </v-btn>
        </v-layout>
      </v-card>
    </v-container>
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
    /*if (!this.$store.state.user.perms.includes('manage_notices')) {
      this.$router.push(`/`);
      return;
    }*/

    this.$http.get("/activity/ias/unaprooved", { withCredentials: true }).then((response) => {
      this.data = response.data.ias.sort((a, b) => {
        return new Date(b.end).getTime() - new Date(a.end).getTime();
      });
    });
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    deny: function (id) {
      this.$http.get("/activity/ias/deny/" + id, { withCredentials: true }).then(() => {
        let indexofdocument = this.data.findIndex((element) => element.id == id);
        this.data.splice(indexofdocument, 1);
      });
    }, accept: function (id) {
      this.$http.get("/activity/ias/accept/" + id, { withCredentials: true }).then(() => {
        let indexofdocument = this.data.findIndex((element) => element.id == id);
        this.data.splice(indexofdocument, 1);
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

<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">Here is your activity!</p>
      </v-container>
    </v-sheet>
    <v-container v-if="!loading" class="mt-n16 mx-auto">
      <v-row class="mt-n6 mb-1">
        <v-col order="last">
          <v-card outlined class="">
            <v-card-text class=""> Time spent in-game </v-card-text>
            <p class="ml-3 mb-2 mt-5 text-h2 mt-n5">{{ stats.mins }}</p>
          </v-card>
        </v-col>
        <v-col order="last">
          <v-card outlined class="">
            <v-card-text class=""> Play sessions </v-card-text>
            <p class="ml-3 mb-2 mt-5 text-h2 mt-n5">
              {{ data.filter((e) => e.type === "session").length }}
            </p>
          </v-card>
        </v-col>
      </v-row>
      <v-card min-width="300" @click.stop="dialog.active = true" ripple class="">
        <v-card-title> 📋 Create a notice </v-card-title>
        <v-card-text class="mt-n6">
          Create an inactivity notice for yourself
        </v-card-text>
      </v-card>
      <notice v-if="data.length" :data="data"></notice>
    </v-container>
    <v-row justify="center">
      <v-dialog v-model="dialog.active" max-width="600px">
        <v-card>
          <v-card-title>New notice </v-card-title>
          <v-card-text class="mt-n5"
            >{{ this.$store.state.group.noticetext || "No notice policy" }}
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
              :rules="[(v) => !!v || 'Reason is required']"
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
import notice from "@/components/notice";
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: { active: false, loading: false },
    loading: true,
    dates: [],
    reason: null,
    dialog: { active: false, loading: false, valid: false },
    data: [],
    stats: {
      sessions: 0,
      mins: 0,
    },
    groups: "dog",
  }),
  components: { notice },
  mounted: function () {
    this.$http.get("/activity/@me", { withCredentials: true }).then((response) => {
      this.loading = false;
      this.stats.mins = response.data.totaltime;
      this.data = response.data.sessions.sort((a, b) => {
        return new Date(b.start).getTime() - new Date(a.start).getTime();
      });
    });
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    getcur: function () {
      let current = new Date();
      return current.toISOString().substring(0, 10);
    },
    dog() {
      this.dialog.loading = true;
      this.$refs.form.validate();
      if (!this.dialog.valid) return;
      if (this.dates.length <= 1) return;
      this.$http
        .post(
          "/activity/createia",
          {
            date: this.dates.sort((a, b) => {
              return new Date(a).getTime() - new Date(b).getTime();
            }),
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
  },
};
</script>

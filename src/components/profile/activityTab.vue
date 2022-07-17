<template>
  <div class="mt-3">
      <v-row class="mt-n6">
        <v-col order="last">
          <v-card outlined class="">
            <v-card-text class=""> Time spent in-game </v-card-text>
            <p class="ml-3 mb-2 mt-5 text-h2 mt-n5">{{ stats.mins }}</p>
          </v-card>
        </v-col>
        <v-col order="last">
          <v-card outlined class="">
            <v-card-text class=""> Play sessions </v-card-text>
            <p class="ml-3 mb-2 mt-5 text-h2 mt-n5">{{ stats.session }}</p>
          </v-card>
        </v-col>
        <v-col order="last">
          <v-card outlined class="">
            <v-card-text class=""> Notices </v-card-text>
            <p class="ml-3 mb-2 mt-5 text-h2 mt-n5">{{ stats.ia }}</p>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-5" wrap>
        <v-col cols="12" sm="12" md="8" xl="10" order="last">
          <notice class="mt-n3" :data="activity"></notice>
        </v-col>
        <v-col order="last">
          <v-card outlined class="">
            <v-card-title> Actions </v-card-title>
            <v-layout wrap class="py-4 ml-1 px-2 mt-n8" align="right">
              <v-btn color="success" class="mr-2 mt-2" @click="openpropt('add')" outlined>
                Add activity
              </v-btn>
              <v-btn
                color="success"
                class="mr-2 mt-2"
                @click="openpropt('remove')"
                outlined
              >
                Remove activity
              </v-btn>
              <v-btn
                color="success"
                @click="openpropt('reset')"
                :loading="resetting"
                class="mr-2 mt-2"
                outlined
              >
                Reset activity
              </v-btn>
            </v-layout>
          </v-card>
        </v-col>
      </v-row>

      <v-snackbar v-model="toast.visible">
        {{ toast.message }}

        <template v-slot:action="{ attrs }">
          <v-btn :color="toast.color" text v-bind="attrs" @click="toast.visible = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>

      <v-dialog v-model="prompt.visible" max-width="400">
        <v-card v-if="prompt.type == 'reset'" :loading="prompt.loading">
          <v-card-title>Reset activity </v-card-title>
          <v-card-text class="mt-n3">
            Are you sure you want to reset the activity of the selected users? This action
            is irrvesible
          </v-card-text>
          <v-btn
            elevation="0"
            :disabled="prompt.loading"
            @click="resetactivity"
            class="mb-4 mr-6 mt-n1 mx-6"
            color="success"
          >
            Submit
          </v-btn>
          <v-btn
            elevation="0"
            class="mb-4 mr-6 mt-n1 float-right"
            @click="prompt.visible = false"
            :disabled="prompt.loading"
            plain
            color="info"
          >
            Cancel
          </v-btn>
        </v-card>

        <v-card v-else :loading="prompt.loading">
          <v-card-title
            >{{ prompt.type.charAt(0).toUpperCase() + prompt.type.slice(1) }}
            activity
          </v-card-title>

          <v-form ref="form" class="mt-n1 mx-6" v-model="prompt.valid" lazy-validation>
            <v-text-field
              outlined
              v-model="prompt.value"
              hide-details="auto"
              :disabled="prompt.loading"
              label="Amount"
              required
              class="mb-3"
              :rules="[
                (v) => !!v || 'Amount is required',
                (v) => !!parseInt(v) || 'Must be a number',
              ]"
            ></v-text-field>
            <v-btn
              elevation="0"
              :disabled="prompt.loading"
              @click="updateactivity"
              class="mb-4 ml-auto"
              color="success"
            >
              Submit
            </v-btn>
            <v-btn
              elevation="0"
              class="mb-4 ml-auto float-right"
              @click="prompt.visible = false"
              :disabled="prompt.loading"
              plain
              color="info"
            >
              Cancel
            </v-btn>
          </v-form>
        </v-card>
      </v-dialog>
      <!-- <v-data-table :headers="headers" :items="data" :items-per-page="5">
        <template v-slot:item="{}" class="pt-5">
          <tr no-hover class="py-5 item">
            <td>username</td>
            <td>IA</td>
            <td>
              <v-layout>
                <p class="my-auto">dog</p>
                 <v-spacer /><v-btn small plain color="success"> </v-btn>
              </v-layout>
            </td>
          </tr>
        </template>
      </v-data-table> -->
  </div>
</template>

<script>
import notice from "@/components/notice";

export default {
  name: "HelloWorld",

  data: () => ({
    prompt: {
      type: "",
      visible: false,
      value: null,
      loading: false,
      valid: false,
    },
    resetting: false,
    groups: "dog",
    data: {},
    stats: {},
    toast: {
      message: "",
      color: "success",
      visible: false,
    },
    activity: [],
  }),
  components: { notice },
  mounted: function () {
    this.$http
      .get("/staff/pactivity/" + this.$route.params.id, {
        withCredentials: true,
      })
      .then((response) => {
        this.activity = response.data.sessions.sort((a, b) => {
          return new Date(b.start).getTime() - new Date(a.start).getTime();
        });
        this.stats = response.data.stats;
      });
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    openpropt: function (type) {
      this.prompt.type = type;
      this.prompt.visible = true;
    },
    resetactivity: function () {
      this.prompt.loading = true;
      this.$http
        .post(
          "/staff/mactivity/reset",
          {
            users: [this.$route.params.id],
          },
          { withCredentials: true }
        )
        .then(() => {
          this.prompt.loading = false;
          this.toast.message = "Activity reset";
          this.toast.visible = true;
          this.stats = {
            session: 0,
            ia: 0,
            mins: 0,
          };
          this.actvity = [];
          this.prompt.visible = false;
        });
    },
    updateactivity: function () {
      this.prompt.loading = true;
      this.$http
        .post(
          "/staff/mactivity/change",
          {
            mins: parseInt(this.prompt.value),
            users: [this.$route.params.id],
            type: this.prompt.type,
          },
          { withCredentials: true }
        )
        .then(() => {
          this.prompt.loading = false;
          this.toast.message = "Activity updated";
          this.toast.visible = true;
          let type = this.prompt.type;
          this.prompt.visible = false;

          this.activity.push({
            type: type,
            mins: type === "add" ? this.prompt.value : -this.prompt.value,
            start: new Date(),
          });

          type === "add"
            ? (this.stats.mins += parseInt(this.prompt.value))
            : (this.stats.mins -= parseInt(this.prompt.value));
        });
    },
    getTime: function (d) {
      let date = new Date(d);
      //get time in date
      let time = date.getMinutes();
      let hour = date.getHours();
      return `${hour}:${time}`;
    },
    firsu: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
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

<style>
.selected {
  outline-style: solid;
  outline-color: #1976d2;
  outline-offset: -2px;
  outline-width: 2px;
}

.item {
  height: 70px !important;
}
</style>

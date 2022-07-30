<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">
          Lets track some activity!
        </p>
      </v-container>
    </v-sheet>
    <v-container class="mt-n16 mx-auto">
      <v-card :loading="loading.igame" outlined class="mx-auto mb-2 pb-2">
        <v-card-title> Activity </v-card-title>
        <v-card-text class="mt-n6"> Currently ingame </v-card-text>

        <p class="ml-4 mt-n4" v-if="!active.length">No data</p>
        <div v-if="!loading.igame" class="mt-n2 ml-4 mb-3">
          <v-tooltip v-for="session in active" :key="session.uid" bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-avatar :color="$store.state.group.color" size="36">
                <img
                  size="36"
                  v-bind="attrs"
                  v-on="on"
                  :src="session.pfp"
                  alt="John"
                />
              </v-avatar>
            </template>
            <span>{{ session.username }}</span>
          </v-tooltip>
        </div>
      </v-card>
      <v-row>
        <v-col order="last" sm="6" cols="12" >
          <v-card :loading="loading.best" outlined class="pb-1 mb-2">
            <v-card-title> Best </v-card-title>
            <v-card-text class="mt-n6">
              The staff who spent the most time ingame since the last reset
            </v-card-text>

            <p class="ml-4 mb-6 mt-n4" v-if="!best.length">No data</p>

            <div v-if="!loading.best" class="mt-n2 ml-4 mb-3">
              <v-tooltip v-for="user in best" :key="user.uid" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-avatar
                    :color="$store.state.group.color"
                    class="mr-1"
                    size="36"
                  >
                    <img
                      size="36"
                      v-bind="attrs"
                      v-on="on"
                      :src="user.pfp"
                      alt="John"
                    />
                  </v-avatar>
                </template>
                <span>{{ user.username }}</span>
              </v-tooltip>
            </div>
          </v-card>
        </v-col>
        <v-col order="last">
          <v-card :loading="loading.out" outlined class="pb-1 mb-2">
            <v-card-title> Inactive </v-card-title>
            <v-card-text class="mt-n6">
              People with approved inactivity notices that are active
            </v-card-text>

            <p class="ml-4 mt-n4" v-if="!off.length">No data</p>

            <div v-if="!loading.off" class="mt-n2 ml-4 mb-3">
              <v-tooltip v-for="ia of off" :key="ia.uid" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-avatar :color="$store.state.group.color" size="36">
                    <img
                      size="36"
                      v-bind="attrs"
                      v-on="on"
                      :src="ia.pfp"
                      alt="John"
                    />
                  </v-avatar>
                </template>
                <span
                  >{{ ia.username }}, {{ getTime(ia.start) }} -
                  {{ getTime(ia.end) }}</span
                >
              </v-tooltip>
            </div>
          </v-card>
        </v-col>
      </v-row>
      <v-row class="mt-n6">
        <v-col order="last">
          <v-card outlined class="">
            <p class="ml-3 mb-2 mt-5 text-h2">{{ stats.mins }}</p>
            <v-card-text class="mt-n6"> Minutes spent in-game </v-card-text>
          </v-card>
        </v-col>
        <v-col order="last">
          <v-card outlined class="">
            <p class="ml-3 mb-2 mt-5 text-h2">{{ stats.sessions }}</p>
            <v-card-text class="mt-n6"> Play sessions </v-card-text>
          </v-card>
        </v-col>
        <v-col order="last">
          <v-card outlined class="">
            <p class="ml-3 mb-2 mt-5 text-h2">{{ stats.staff }}</p>
            <v-card-text class="mt-n6"> Unique staff </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <div
        v-if="this.$store.state.user.perms.includes('manage_staff_activity')"
        class="mt-2"
      >
        <v-card @click.stop="prompt.visible = true" ripple class="mt-2">
          <v-card-title> 📋 Reset activity </v-card-title>
          <v-card-text class="mt-n6">
            Reset all activity in the database
          </v-card-text>
        </v-card>
      </div>
    </v-container>
    <v-dialog v-model="prompt.visible" max-width="400">
      <v-card :loading="prompt.loading">
        <v-card-title>Reset actvity </v-card-title>
        <v-card-text class="mt-n3">
          Are you sure you want to reset the activity of all users in the database?
          This action is irrvesible
        </v-card-text>
        <v-btn
          elevation="0"
          :disabled="prompt.loading"
          @click="reset"
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
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: { best: true, igame: true, off: true },
    host: location.host,

    active: [],
    stats: {
      loading: true,
    },
    prompt: {
      type: "",
      visible: false,
      value: null,
      loading: false,
      valid: false,
    },
    off: [],
    best: [],
    groups: "dog",
  }),
  components: {},
  methods: {
    getTime: function (date) {
      const nth = function (d) {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      };

      let d = new Date(date);
      let day = d.getDate();

      return `${d.toLocaleString("en", { month: "short" })} ${day + nth(day)}`;
    },
    reset: function () {
      this.best = [];
      this.prompt.loading = true
      this.$http.post("/settings/resetactivity", {}, { withCredentials: true });
      this.prompt.loading = false;
      this.prompt.visible = false;
    },
  },
  mounted: function () {
    this.$http
      .get("/activity/activityinfo", { withCredentials: true })
      .then((response) => {
        this.loading.igame = false;
        this.active = response.data;
      });

    this.$http
      .get("/activity/stats", { withCredentials: true })
      .then((response) => {
        response.data.loading = false;
        this.stats = response.data;
      });

    this.$http
      .get("/activity/best", { withCredentials: true })
      .then((response) => {
        this.loading.best = false;
        this.best = response.data;
      });

    this.$http
      .get("/activity/off", { withCredentials: true })
      .then((response) => {
        this.loading.off = false;
        this.off = response.data;
      });
    let { protocol} = location;
    let connection = new WebSocket(
      `${protocol=== 'https' ? `wss` : 'ws' }://${this.$http.defaults.baseURL}/socket`
    );

    connection.onopen = () => {
      console.log("[-] Connected to WS");
    };

    connection.onerror = (error) => {
      console.log(`WebSocket error: ${error}`);
    };

    connection.onmessage = (e) => {
      let data = JSON.parse(e.data);
      if (data.type == "playadd") {
        this.active.push(data.data);
      }

      if (data.type == "playrm") {
        this.active.splice(
          this.active.findIndex((i) => i.uid == data.uid),
          1
        );
      }
    };
  },
};
</script>

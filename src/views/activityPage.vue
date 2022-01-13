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
      <v-card outlined class="mx-auto mb-2 pb-2">
        <v-card-title> Activity </v-card-title>
        <v-card-text class="mt-n6"> Currently ingame </v-card-text>

        <v-row v-if="loading.igame" class="mx-auto mb-4">
          <v-progress-circular
            :size="40"
            color="amber"
            class="mx-auto"
            indeterminate
          ></v-progress-circular>
        </v-row>
        <p class="ml-4 mt-n4" v-if="!active.length"> No data </p>
        <div v-if="!loading.igame" class="mt-n2 ml-4 mb-3">
          <v-tooltip v-for="session in active" :key="session.uid" bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-avatar :color="$store.state.group.color" size="36">
                <img size="36" v-bind="attrs" v-on="on" :src="session.pfp" alt="John" />
              </v-avatar>
            </template>
            <span>{{ session.username }}</span>
          </v-tooltip>
        </div>
      </v-card>
      <v-row>
        <v-col order="last">
          <v-card outlined class="mb-2 pb-2">
            <v-card-title> The best </v-card-title>
            <v-card-text class="mt-n6">
              Staff In-game most since the last activity reset
            </v-card-text>
            <v-row v-if="loading.best" class="mx-auto mt-1 mb-4">
              <v-progress-circular
                :size="40"
                color="amber"
                class="mx-auto"
                indeterminate
              ></v-progress-circular>
            </v-row>
            <p class="ml-4 mb-2 mt-n4" v-if="!best.length"> No data </p>

            <div v-if="!loading.best" class="mt-n2 ml-4 mb-4">
              <v-tooltip v-for="user in best" :key="user.uid" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-avatar :color="$store.state.group.color" class="mr-1" size="36">
                    <img size="36" v-bind="attrs" v-on="on" :src="user.pfp" alt="John" />
                  </v-avatar>
                </template>
                <span>{{ user.username }}</span>
              </v-tooltip>
            </div>
          </v-card>
        </v-col>
        <v-col order="last">
          <v-card outlined class="mb-2">
            <v-card-title> Inactive </v-card-title>
            <v-card-text class="mt-n6">
              People with approved inactivity notices that are active
            </v-card-text>
            <v-row v-if="loading.out" class="mx-auto mt-1 mb-4">
              <v-progress-circular
                :size="40"
                color="amber"
                class="mx-auto"
                indeterminate
              ></v-progress-circular>
            </v-row>
                    <p class="ml-4 mt-n4" v-if="!off.length"> No data </p>

            <div v-if="!loading.off" class="mt-n2 ml-4 mb-3">
              <v-tooltip v-for="ia of off" :key="ia.uid" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-avatar :color="$store.state.group.color" size="36">
                    <img size="36" v-bind="attrs" v-on="on" :src="ia.pfp" alt="John" />
                  </v-avatar>
                </template>
                <span>{{ ia.username }}, {{ getTime(ia.start) }} - {{ getTime(ia.end) }}</span>
              </v-tooltip>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
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

      return `${d.toLocaleString("en", { month: "short" })} ${day + nth(day)}`
    },
  },
  mounted: function () {
    this.$http.get("/activityinfo", { withCredentials: true }).then((response) => {
      this.loading.igame = false;
      this.active = response.data;
    });

    this.$http.get("/best", { withCredentials: true }).then((response) => {
      this.loading.best = false;
      this.best = response.data;
    });

    this.$http.get("/off", { withCredentials: true }).then((response) => {
      this.loading.off = false;
      this.off = response.data;
    });
    let connection = new WebSocket(`ws://${this.host}/api/socket`);

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

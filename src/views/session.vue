<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">Session #{{ session.id }}</p>
      </v-container>
    </v-sheet>
    <v-container class="mt-n16 mx-auto">
      <v-card v-if="!session.started"  class="mb-3" outlined>
        <v-layout class="ml-6" v-if="!loading">
          <div>
            <p class="grey--text mt-2">Starts in</p>
            <p class="text-h4 mt-n3 mb-6 my-auto font-weight-bold">
              <countdown @end="started" :time="gettime(session)">
                <template slot-scope="props"
                  >{{ props.days }} days, {{ props.hours }} hours,
                  {{ props.minutes }} minutes, {{ props.seconds }} seconds.</template
                >
              </countdown>
            </p>
          </div></v-layout
        ></v-card
      >
      <v-card min-width="300" height="80" class="mb-n6" outlined>
        <v-img
          max-height="200"
          height="78"
          gradient="to bottom, rgba(255,255,255,0.3), rgba(255,255,255,1)"
          class="py-auto"
          :src="session.thumbnail"
        >
          <v-layout>
            <v-card-title class="mt-2 my-auto">
              @ {{ session.type.gname }}
              <v-spacer />
            </v-card-title>
            <v-spacer />
            <v-btn @click="play" class="my-auto mr-2 mt-6" plain color="success">
              Play <v-icon right dark> mdi-arrow-right </v-icon>
            </v-btn>
          </v-layout>
        </v-img>
      </v-card>
      <v-row class="mt-5" wrap>
        <v-col cols="12" sm="12" md="8" xl="10" order="last">
          <v-card height="110" outlined>
            <v-layout v-if="!loading" class="">
              <v-avatar
                class="my-auto rounded-l mr-3"
                :color="$store.state.group.color"
                tile
                size="109"
              >
                <v-img :src="session.user.pfp"></v-img>
              </v-avatar>
              <div>
                <p class="grey--text mt-2">Hosted by</p>
                <p class="text-h4 mt-n3 my-auto font-weight-bold">
                  {{ session.user.username }}
                </p>
              </div></v-layout
            ></v-card
          >
        </v-col>
        <v-col v-if="$store.state.user.perms.includes('host_sessions')" order="last">
          <v-card outlined class="">
            <v-card-title> Actions </v-card-title>
            <v-layout wrap class="py-4 ml-1 px-2 mt-n8" align="right">
              <v-btn @click="end" color="success" class="mr-2 mt-2" outlined>
                {{ session.started ? 'End' : 'Cancel'}} session
              </v-btn>
            </v-layout>
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
    session: {},
    enabled: true,
    loading: false,
    groups: "dog",
  }),
  mounted() {
    this.$http.get("/session/" + this.$route.params.id).then((response) => {
      this.session = response.data.data;
    });
  },
  components: {},
  methods: {
    goto: function (url) {
      this.$router.push(url);
    }, play: function() {
      console.log(this.session.type.gid)
      window.open(`https://www.roblox.com/games/${this.session.type.gid}/-`)
    },
    gettime: function () {
      const now = new Date().getTime();
      const start = new Date(this.session.start).getTime();
      console.log(start);
      const distance = start - now;

      if (distance < 0) {
        this.session.started = true;
        return 0;
      }

      return distance;
    }, started: function() {
      this.session.started = true;
    },end: function () {
      this.loading = true;
      this.$http.post("/session/end", {
        id: this.session.id
      }).then(() => {
        this.loading = false;
        this.$router.push("/sessions");
      });
    },
    open: function (url) {
      window.open(url);
    },
  },
};
</script>

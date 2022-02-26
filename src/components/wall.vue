<template>
  <div>
    <v-card v-if="$store.state.user.perms.includes('post_on_wall')" outlined>
      <v-layout class="">
        <v-avatar tile size="55" class="rounded-l">
          <v-img :src="$store.state.user.pfp"></v-img>
        </v-avatar>
        <v-text-field
          solo
          flat
          v-model="message"
          :label="`Posting as ${$store.state.user.username}`"
          class="mb-n8 mt-1"
          :disabled="loading"
        >
        </v-text-field> </v-layout
    ></v-card>
    <v-btn
      v-if="message.length"
      @click="send"
      :loading="loading"
      elevation="0"
      class="mt-2"
      color="info"
    >
      Send
    </v-btn>

    <v-card v-for="msg in fetchposts()" :key="msg.id" outlined class="mt-2">
      <v-layout class="">
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-avatar
              v-bind="attrs"
              size="60"
              v-on="on"
              tile
              class="rounded-lt rounded-br"
            >
              <v-img :src="msg.pfp"></v-img>
            </v-avatar>
          </template>
        </v-tooltip>
        <div class="my-auto ml-3">
          <p class="text-h5 my-auto font-weight-bold">{{ msg.username }}</p>
          <p class="text-body-1 my-auto grey--text mt-n2 gray">
            {{ getDate(msg.date) }} at {{ getTime(msg.date) }}
          </p>
        </div>
        <v-chip
          v-if="msg.shout"
          class="my-auto ml-3 white--text ml-0"
          color="purple"
          label
          small
        >
          Group shout
        </v-chip>
        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="del(msg.id)"
          v-if="$store.state.user.perms.includes('admin')"
          class="mr-2 mt-2"
        >
          <v-icon> mdi-delete </v-icon>
        </v-btn>
      </v-layout>
      <p class="my-auto grey--text mx-3 py-3">
        {{ msg.message }}
      </p></v-card
    >
    <v-layout v-if="ishome">
      <v-btn
        plain
        elevation="0"
        color="blue"
        class="mx-auto mt-3"
        @click="$router.push('/wall')"
      >
        View all posts
      </v-btn>
    </v-layout>
  </div>
</template>

<script>
export default {
  data: () => ({
    messages: [],
    message: "",
    loading: false,
  }),
  props: ["ishome"],
  methods: {
    fetchposts() {
      if (this.ishome) {
        return this.messages.slice(0, 4);
      }

      return this.messages;
    },
    send: function () {
      this.loading = true;
      this.$http
        .post("/wall/send", { message: this.message }, { withCredentials: true })
        .then((response) => {
          this.messages.unshift(response.data.msg);
          this.message = "";
          this.loading = false;
        });
    },
    getTime: function (d) {
      let date = new Date(d);
      //get time in date
      let time = date.getMinutes();
      let hour = date.getHours();
      return `${hour}:${time > 10 ? time : "0" + time}`;
    },
    getDate: function (d) {
      let date = new Date(d);

      //get time in date
      let m = date.toLocaleString("en", { month: "short" });
      let day = date.getDate();
      return `${day} ${m}`;
    },
    del: function (id) {
      this.messages.splice(
        this.messages.findIndex((i) => i.id == id),
        1
      );
      this.$http.post("/wall/delete", { id: id }, { withCredentials: true });
    },
  },
  beforeDestroy() {
    this.connection?.close();
  },
  mounted() {
    this.$http
      .get("/wall/messages")
      .then((response) => {
        this.messages = response.data;
      })
      .catch((error) => {
        console.log(error);
      });
    let connection = new WebSocket(`ws://${this.$http.defaults.baseURL}/wall/socket`);
    this.connection = connection;

    connection.onopen = () => {
      console.log("[-] Connected to WS");
    };

    connection.onerror = (error) => {
      console.log(`WebSocket error: ${error}`);
    };

    connection.onmessage = (e) => {
      let data = JSON.parse(e.data);
      if (data.type == "send") {
        if (data.data.author === this.$store.state.user.id && !data.data.shout) return;
        this.messages.unshift(data.data);
      }

      if (data.type == "delete") {
        if (data.data.actor === this.$store.state.user.id) return;
        this.messages.splice(
          this.messages.findIndex((i) => i.id == data.data.id),
          1
        );
      }
    };
  },
};
</script>

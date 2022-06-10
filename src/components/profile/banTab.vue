<template>
  <div>
    <v-card outlined v-if="!ban.banned">
      <v-card-title> Not banned  </v-card-title>
      <v-card-text class="mt-n6"> This user is not banned from your game </v-card-text>
    </v-card>
     <v-card outlined v-if="ban.banned">
      <v-card-title> This user is banned  </v-card-title>
      <v-card-text class="mt-n6"> {{ ban.reason }} </v-card-text>
      <v-divider> </v-divider>
      <div class="mx-2 my-2" >
       <v-btn @click="unban" text color="red"> Unban </v-btn> 
       <v-btn @click="banp.visible = true" text color="blue"> Edit ban </v-btn> 
      </div>
    </v-card>
    <v-dialog v-model="banp.visible" max-width="400">
      <v-card>
        <v-card-title> Edit Ban </v-card-title>
        <v-card-text class="mt-n3">
          <v-text-field
            outlined
            v-model="reason"
            hide-details="auto"
            :disabled="banp.loading"
            label="Reason"
            required
            class="mt-3 mb-2"
            v-bind="reason"
            :rules="[(v) => !!v || 'Reason is required']"
          ></v-text-field>
          <v-btn
            elevation="0"
            :disabled="banp.loading"
            @click="updateban()"
            class="ml-auto"
            color="success"
          >
            Submit
          </v-btn>
          <v-btn
            elevation="0"
            class="ml-auto float-right"
            @click="banp.visible = false"
            :disabled="banp.loading"
            plain
            color="info"
          >
            Cancel
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>

export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: true,
    valid: true,
    groles: [],
    srole: null,
    tab: 1,
    reason: "",
    ban: {
      banned: false,
      reason: "",
      userid: ""
    },
    resetting: false,
    banp: {
      visible: false,
      value: null,
      loading: false,
      valid: false,
    },
    groups: "dog",
    toast: {
      message: "",
      color: "success",
      visible: false,
    },
    activity: [],
  }),
  components: {  },
  mounted: function () {
    this.$http.get("/bans/banned/" + this.$route.params.id).then((response) => {
      this.ban = response.data;
      console.log(this.ban);
      console.log(response);
    });
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    updateban: function () {
      this.$http
        .post("/bans/edit", {
          reason: this.reason,
          userid: this.ban.userid,
        })
        .then(() => {
          this.toast.message = "Ban reason updated";
          this.toast.visible = true;
          this.banp.visible = false;
          this.ban.reason = this.reason;
        });
    },
    openpropt: function (type) {
      this.prompt.type = type;
      this.prompt.visible = true;
    },

    getcur: function () {
      let current = new Date();
      return current.toISOString().substring(0, 10);
    },
    unban: function () {
      this.$http
        .post(
          "/bans/unban",
          {
            userid: this.ban.userid,
          },
          { withCredentials: true }
        )
        .then(() => {
          this.toast.message = "User unbanned, reload the page to view changes."; /*dev team, I don't know vue so please just make this reload the page! also quick thing to note, for some reason you can ban players multiple times, the user profile just displays the oldest one until u get to none!!! - so either make it so you can only ban a player once (if they are alr banned) and just set the text to this player isn't banned OR make it reload the page!*/
          this.toast.visible = true;
          this.prompt.visible = false;
          this.ban.banned = false;
        });
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

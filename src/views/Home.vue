<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">Welcome to your home</p>
      </v-container>
    </v-sheet>
    <v-container class="mt-n16 mx-auto">
      <v-card min-width="300" height="auto" v-if="update.version" class="mb-4" outlined>
        <v-img
          max-height="100"
          height="78"
          gradient="to bottom, rgba(255,255,255,0.3), rgba(255,255,255,1)"
          class="py-auto"
          :src="update.img"
        >
          <v-layout>
            <div>
              <v-card-title class="my-auto">
                {{ update.title }}
              </v-card-title>
              <v-card-text class="mt-n6">
                Update to Tovy {{ update.version }} for the newest features
              </v-card-text>
            </div>
            <v-spacer />
            <v-btn class="my-auto mr-2" @click="open(`${update.url}`)" plain color="info">
              View the log
            </v-btn>
            <v-btn class="my-auto mr-2" @click="open(`https://itswhooop.gitbook.io/tovy/hosting/updating-railway`)" plain color="success">
              Learn how <v-icon right dark> mdi-arrow-right </v-icon>
            </v-btn>
          </v-layout>
        </v-img>
      </v-card>

      <v-row class="">
        <v-col order="last">
          <v-card
            min-width="300"
            @click.stop="goto('/activity')"
            ripple
            outlined
            class="mb-n4"
          >
            <v-card-title> 📋 Your notices </v-card-title>
            <v-card-text class="mt-n6"> View your inactivity notices </v-card-text>
          </v-card>
        </v-col>
        <v-col
          v-if="this.$store.state.user.perms.includes('view_staff_activity')"
          order="last"
        >
          <v-card
            min-width="300"
            @click.stop="goto('/activity')"
            ripple
            outlined
            class="mb-n4"
          >
            <v-card-title> ⏱ Staff activity </v-card-title>
            <v-card-text class="mt-n6">
              View the recent activity from your staff
            </v-card-text>
          </v-card>
        </v-col>
        <v-col
          v-if="this.$store.state.user.perms.includes('manage_notices')"
          order="last"
        >
          <v-card
            @click.stop="goto('/reviewa')"
            min-width="300"
            ripple
            outlined
            class="mb-2"
          >
            <v-card-title> ✅ Notices </v-card-title>
            <v-card-text class="mt-n6">
              View the notices from your staff team
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="mt-1 mb-3"> </v-divider>
      <wall :ishome="true"> </wall>
    </v-container>
  </div>
</template>

<script>
import wall from "@/components/wall";
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: false,
    groups: "dog",
    update: {},
  }),
  mounted() {
    if (this.$store.state.user.perms.includes("admin")) {
      this.$http
        .get("/checkupdates")
        .then((response) => {
          this.update = response.data;
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      console.log("np");
    }
  },
  components: {
    wall,
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    open: function (url) {
      window.open(url);
    },
  },
};
</script>

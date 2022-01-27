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
      <v-row>
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
      <v-card outlined>
        <v-row class="mx-auto mb-5 mt-5">
          <v-img
            src="../assets/experimental-sleepy-tiger-coming-out-of-the-cave-in-the-morning.png"
            class="mx-auto mt-7"
            max-width="400"
          ></v-img>
          <v-card-text class="text-center mt-n5 mb-n4">
            There is nothing here so here is a graphic instead
          </v-card-text>
        </v-row></v-card
      >
    </v-container>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: false,
    groups: "dog",
  }),
  components: {},
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
  },
};
</script>

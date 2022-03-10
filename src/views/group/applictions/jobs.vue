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
      <v-card
        min-width="300"
        @click.stop="goto('/activity')"
        ripple
        outlined
        class="mb-n4"
      >
        <v-card-title> ➕ Create </v-card-title>
        <v-card-text class="mt-n6"> Create a new job bitch </v-card-text>
      </v-card>
      <v-row class="mt-3">
        <v-col v-for="i in 3" :key="i" order="last" cols="12" sm="6" xl="3" lg="4" md="6">
          <v-card min-width="100" outlined class="mb-n4">
            <v-progress-linear
              background-color="red"
              color="green"
              value="95"
            ></v-progress-linear>
            <v-card-title>Free robux 100% working!!!</v-card-title>
            <v-card-text class="mt-n5">Appply for free robux</v-card-text>
            <v-card-text class="mt-n8 blue--text font-weight-bold">95 unread applications</v-card-text>
            <v-divider></v-divider>
            <v-card-actions wrap>
              <v-btn text :color="$store.state.group.color" to="/job/12/applictions">
                Review applications
              </v-btn> <v-btn text :color="$store.state.group.color" to="/job/12/settings">
                Settings
              </v-btn>
            </v-card-actions>
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
    loading: false,
    groups: "dog",
    update: {},
  }),
  mounted() {},
  components: {},
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

<template>
  <div>
    <v-app-bar flat color="white">
      <v-spacer /><v-menu min-width="150px" class="mt-6" offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-hover v-slot="{ hover }">
            <v-avatar
              color="grey lighten-2"
              :class="`transition-fast-in-fast-out ${hover ? 'elevation-2' : ''}`"
              v-ripple
              v-bind="attrs"
              v-on="on"
              size="30px"
            >
              <v-img :src="$store.state.user.pfp"> </v-img
            ></v-avatar>
          </v-hover>
        </template>

        <v-list c>
          <!-- <v-list-item @click="() => {}">
            <v-list-item-title>Change password</v-list-item-title>
          </v-list-item> -->
          <v-list-item @click="() => {}">
            <v-list-item-title>Profile settings</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
    <slot />
  </div>
</template>

<script>
export default {
  name: "App",

  components: {},
  methods: {
    logout() {
      this.$router.push("/signin");
      this.$cookies.remove("connect.sid");
    },
  },
};
</script>

<template>
  <div>
    <v-app-bar v-if="isMobile()" color="#f7f7f7" flat absolute app dark>
      <v-app-bar-nav-icon
        color="black"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>
    </v-app-bar>
    <v-navigation-drawer
      :permanent="!isMobile()"
      :temporary="isMobile()"
      v-model="drawer"
      :mini-variant.sync="mini"
      :expand-on-hover="!isMobile()"
      left
      app
    >
      <v-list dense shaped>
        <v-list-item link>
          <v-list-item-avatar :color="$store.state.group.color" class="ml-n2 my-auto">
            <v-img :src="fetchusername().pfp"></v-img>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              {{ fetchusername().username }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="logout" link class="mt-2" >
          <v-list-item-icon>
            <v-icon>mdi-exit-to-app</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider class="mt-2 mb-2"> </v-divider>

        <v-list-item link :to="`/`">
          <v-list-item-icon>
            <v-icon>mdi-home</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
         <v-list-item class="mt-2" link @click="goto(`https://roblox.com/groups/${$store.state.group.id}`)">
          <v-list-item-icon>
            <v-icon>mdi-open-in-new</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ this.$store.state.group.id }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider class="mt-2"> </v-divider>
        <v-list-item link class="mt-2" :to="`/youractivity`">
          <v-list-item-icon>
            <v-icon>mdi-format-list-bulleted</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Your activity</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="this.$store.state.user.perms.includes('view_staff_activity')" link class="mt-2" :to="`/activity`">
          <v-list-item-icon>
            <v-icon>mdi-clock</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Activity</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="this.$store.state.user.perms.includes('manage_notices')"  link class="mt-2" :to="`/reviewa`">
          <v-list-item-icon>
            <v-icon>mdi-clipboard-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Review notices</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider class="mt-2"> </v-divider>

        <v-list-item
          link
          v-if="this.$store.state.user.perms.includes('admin')"
          class="mt-2"
          :to="`/settings`"
        >
          <v-list-item-icon>
            <v-icon>mdi-cog</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  data: () => ({
    drawer: false,
    mini: true,
  }),
  methods: {
    isSmall: function () {
      return window.innerWidth < 600;
    },
    fetchusername() {
      return this.$store.state.user;
    }, goto: function (url) {
      window.open(url, '_blank');
    },
    logout() {
      this.$cookies.remove("session.sig");
      this.$cookies.remove("session"); 

      this.$router.go('/')
    },
    isMobile: function () {
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        this.mini = false;
        return true;
      } else {
        return false;
      }
    },
  },
};
</script>

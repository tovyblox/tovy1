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
        <v-list-item @click="gotoProfile('/profile/'  + $store.state.user.id)" link>
          <v-list-item-avatar :color="$store.state.group.color" class="ml-n2 my-auto">
            <v-img :src="fetchusername().pfp"></v-img>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              {{ fetchusername().username }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="logout" link class="mt-2">
          <v-list-item-icon>
            <v-icon>mdi-exit-to-app</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="twofa = true" link class="mt-2">
          <v-list-item-icon>
            <v-icon>{{!$store.state.user['2fa'] ? 'mdi-lock' : 'mdi-lock-open'}}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{$store.state.user['2fa'] ? 'Disable 2FA' : 'Enable 2FA'}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        
        <v-list-item @click="darkmode" link class="mt-2">
          <v-list-item-icon>
            <v-icon>mdi-theme-light-dark</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ this.$vuetify.theme.dark ? 'Light mode' : 'Dark mode'}}</v-list-item-title>
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
         <v-list-item link class="mt-2" :to="`/wall`">
          <v-list-item-icon>
            <v-icon>mdi-wall</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Wall</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          class="mt-2"
          link
          @click="goto(`https://roblox.com/groups/${$store.state.group.id}`)"
        >
          <v-list-item-icon>
            <v-icon>mdi-open-in-new</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Group</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider class="mt-2"> </v-divider>

        <div v-for="page in pages" :key="page.path">
          <v-list-item
            link
            class="mt-2"
            v-if="
              page.permission ? $store.state.user.perms.includes(page.permission) : true
            "
            :to="page.path"
          >
            <v-list-item-icon>
              <v-icon>{{ page.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title> {{ page.name }} </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </div>

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

        <v-list-item
          link
          v-if="this.$store.state.user.perms.includes('admin')"
          class="mt-2"
          :to="`/automation`"
        >
          <v-list-item-icon>
            <v-icon>mdi-robot</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Automation</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          link
          v-if="this.$store.state.user.perms.includes('admin')"
          class="mt-2"
          :to="`/audit`"
        >
          <v-list-item-icon>
            <v-icon>mdi-clipboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Logs</v-list-item-title>
          </v-list-item-content>
        </v-list-item>


        <v-list-item
          link
          v-if="this.$store.state.user.perms.includes('admin')"
          class="mt-2"
          :href="`https://github.com/ItsWHOOOP/tovy`"
        >
          <v-list-item-icon class="">
            <v-icon>mdi-github</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Github</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <tfasetup @close="twofa = false" v-model="twofa"></tfasetup>
  </div>
</template>

<script>
import tfasetup from '@/components/tfasetup'
export default {
  components: {tfasetup},
  data: () => ({
    drawer: false,
    mini: true,
    twofa: false,
    pages: [
      {
        name: "Activity",
        icon: "mdi-clock",
        path: "/activity",
        permission: "view_staff_activity",
      },
      {
        name: "Your activity",
        icon: "mdi-format-list-bulleted",
        path: "/youractivity",
      }, {
        name: "Sessions",
        icon: "mdi-bullhorn-outline",
        path: "/sessions",
      },
      {
        name: "Tasks",  
        icon: "mdi-checkbox-marked-circle-outline",
        path: "/tasks",
      },
      {
        name: "Review notices",
        icon: "mdi-clipboard-check",
        path: "/reviewa",
        permission: "manage_notices",
      },
      {
        name: 'Ban',
        path: '/ban',
        icon: 'mdi-gavel',
        permission: "manage_bans",
      },
      {
        name: "View staff",
        icon: "mdi-account-multiple",
        path: "/staff",
        permission: "manage_staff_activity",
      },
    ],
  }),
  methods: {
    isSmall: function () {
      return window.innerWidth < 600;
    }, darkmode: function () {
      let nextstatus = !this.$vuetify.theme.dark
      localStorage.setItem("darkMode", nextstatus);
      this.$vuetify.theme.dark = nextstatus;


    },
    fetchusername() {
      return this.$store.state.user;
    },
    goto: function (url) {
      window.open(url, "_blank");
    },
    logout() {
      this.$cookies.remove("session.sig");
      this.$cookies.remove("session");

      this.$router.go("/");
    },
    gotoProfile(url) {
      this.$router.push(url);
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

<style>
.fixedBottom {
  position: fixed !important;
  bottom: 10px !important;
  width: 100%;
}
</style>

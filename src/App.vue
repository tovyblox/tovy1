<template>
  <v-app>
    <v-progress-circular
      :size="50"
      color="amber"
      class="mx-auto my-auto"
      indeterminate
      v-if="loading"
    ></v-progress-circular>
    <component v-if="!loading" :is="layout">
      <router-view />
    </component>
  </v-app>
</template>

<script>
export default {
  name: "App",
  computed: {
    layout() {
      return (this.$route.meta.layout || "default") + "-layout";
    },
  },
  data: () => ({
    loading: true,
    invite: ""
  }),
  mounted: function () {
   // this.loading = false;
    //this.$router.push("/nr");
     if (this.$route.path.includes('/invite/')) {
      this.invite = this.$route.params.code
    }

    this.$http
      .get("/profile", { withCredentials: true })
      .catch(error => {
        if (!error.response) {
          this.loading = false;
          if (this.$route.path == "/error") return;
          this.$router.push("/error");
        }
        setTimeout(() => {
          this.loading = false;
        }, 300);

        if (error.response.status === 401) {
          if (this.$route.path == "/login" || this.$route.path == '/signup') return;
          this.$router.push(`/login${this.invite ? `?invite=${this.invite}` : ''}`);
        }

        if (error.response.status === 404) {
          this.loading = false;
          if (this.$route.path == "/error") return;
          this.$router.push("/error");
        }

        if (error.response.status === 403) {
          if (this.$route.path == "/forbidden") return;
          this.$router.push("/forbidden");
        }

        if (error.response.status === 400) {
          if (this.$route.path == "/welcome") return;
          this.$router.push("/welcome");
        }
        return;
      })
      .then((response) => {
        if (!response) return;
        if (this.$route.path == "/error") {
          this.$router.push("/");
        }

        if (this.$route.path == "/welcome") {
          this.$router.push("/");
        }
        response.data.info.pfp = response.data.pfp;
        this.$store.commit("setuser", response.data.info);
        this.$store.commit("netntext", response.data.group.noticetext);
        this.$store.commit("setgroup", response.data.group);

        setTimeout(() => {
          this.loading = false;
        }, 300);
      }); 
  },
};
</script>

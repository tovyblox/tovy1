<template>
  <div style="height: 100%">
    <v-sheet color="grey lighten-2" height="200" style="width: 100%"> </v-sheet>
    <v-container class="mt-n10 mx-auto">
      <v-card min-width="200px" max-width="600px" outlined class="mt-n3 mx-auto">
        <v-card-title class="mb-n6"> Not ready </v-card-title>
        <v-card-text class="mt-n4">
          This version of tovy is not ready for usage! 
        </v-card-text>
        <v-img src="../assets/no-perms.png" class="mx-auto mt-7" max-width="400"></v-img>
      </v-card>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "Welcome",
  data: () => ({
    e1: 1,
    code: "",
    valid: true,
    host: location.host,
    dialog: {
      active: false,
      loading: false,
      incorrect: false,
      valid: true,
    },
  }),
  methods: {
    sendinvite: function () {
      this.dialog.loading = true;
      this.$http.post("/invite", { code: this.code }, { withCredentials: true }).then(
        () => {
          this.$http.get("/profile", { withCredentials: true }).then((response) => {
            if (!response) return;
            response.data.info.pfp = response.data.pfp;
            this.$store.commit("setuser", response.data.info);
            this.$store.commit("setgroup", response.data.group);

            setTimeout(() => {
              this.$router.push("/");
            }, 1000);
          });
        },
        () => {
          this.dialog.incorrect = true;
          this.dialog.loading = false;
        }
      );
    },
  },
};
</script>

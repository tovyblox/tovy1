<template>
  <div style="height: 100%">
    <v-sheet color="grey lighten-2" height="200" style="width: 100%"> </v-sheet>
    <v-container class="mt-n10 mx-auto">
      <v-card min-width="200px" max-width="600px" outlined class="mt-n3 mx-auto">
        <v-card-title class="mb-n6"> Server error </v-card-title>
        <v-card-text class="mt-n4">
          Looks like the server is having some issues! Please try again later
        </v-card-text>
        <v-img src="../assets/conifer-access-denied.png" class="mx-auto mt-7" max-width="400"></v-img>
        <v-row class="mb-3">
          <v-btn @click="reload" class="mx-auto mb-1 mt-3 info">
            Refersh
          </v-btn>
        </v-row>
      </v-card>
      <p class="text-center grey--text mt-2"> ©Tovy 2022 </p>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "Welcome",
  data: () => ({
    e1: 1,
    username: "",
    password: "",
    valid: true,
    group: "",
    name: "",
  }), methods: {
    reload: function() {
      window.location.reload();
    },
  }
};
</script>

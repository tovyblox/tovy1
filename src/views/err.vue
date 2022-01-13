<template>
  <div style="height: 100%">
    <v-sheet color="grey lighten-2" height="200" style="width: 100%"> </v-sheet>
    <v-container class="mt-n10 mx-auto">
      <v-card min-width="200px" max-width="600px" outlined class="mt-n3 mx-auto">
        <v-card-title class="mb-n6"> Server Error </v-card-title>
        <v-card-text class="mt-n4"> We've ran into a server error, please try again laster </v-card-text>
        <v-row class="mx-auto mb-5 mt-5">
          <v-progress-circular
            :size="50"
            color="amber"
            class="mx-auto"
            indeterminate
          ></v-progress-circular>
        </v-row>
      </v-card>
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
  })
};
</script>

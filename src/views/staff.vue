<template>
  <div>
    <v-container>
      <p class="text-h4 font-weight-bold mt-14">Staff</p>
    </v-container>
    <v-container>
      <v-layout wrap class="mb-7">
        <v-btn class="my-auto mr-2 mt-1" elevation="0" color="success"> Select all visible </v-btn>
        <v-btn class="my-auto mr-2 mt-1" elevation="0" color="info"> Activity reset selected </v-btn>
        <v-spacer> </v-spacer>

        <v-select
          :items="groles"
          dense
          class="my-auto mt-1"
          style="max-width: 200px"
          outlined
          hide-details="auto"
          item-value="rank"
          item-text="name"
        >
        </v-select>
      </v-layout>
      <v-data-iterator :items="data" :items-per-page="20">
        <template v-slot:default="{ items }">
          <v-row align="center">
            <v-col
              v-for="item in items"
              :key="item.username"
              cols="12"
              class="mt-n4"
              sm="6"
              md="4"
              lg="3"
              ><v-card ripple outlined class="py-n1">
                <v-layout>
                  <v-avatar
                    class="my-auto ml-3 mr-n2"
                    :color="$store.state.group.color"
                    size="36"
                  >
                    <v-img :src="$store.state.user.pfp"></v-img>
                  </v-avatar>
                  <div>
                    <v-card-title> {{ item.username }}</v-card-title>
                    <v-card-text class="mt-n6 grey--text"> Rank 19 </v-card-text>
                  </div></v-layout
                >
              </v-card></v-col
            ></v-row
          ></template
        >
      </v-data-iterator>
      <!-- <v-data-table :headers="headers" :items="data" :items-per-page="5">
        <template v-slot:item="{}" class="pt-5">
          <tr no-hover class="py-5 item">
            <td>username</td>
            <td>IA</td>
            <td>
              <v-layout>
                <p class="my-auto">dog</p>
                 <v-spacer /><v-btn small plain color="success"> </v-btn>
              </v-layout>
            </td>
          </tr>
        </template>
      </v-data-table> -->
    </v-container>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: false,
    valid: true,
    groles: [],
    groups: "dog",
    headers: [
      { text: "Username", value: "username" },
      { text: "Status", value: "status" },
      { text: "Minuites in game", value: "min" },
    ],
    data: [
      { username: "ItsWHOOOP", min: "10" },
      { username: "katetheass", min: "8" },
      { username: "sobbing", min: "392" },
      { username: "mynamejade", min: "3", ia: true },
      { username: "nosbbing", min: "2", ia: true },
      { username: "mynamejade", min: "3", ia: false },
    ],
  }),
  components: {},
  mounted: function () {
    this.$http.get("/group/roles", { withCredentials: true }).then((response) => {
      this.groles = response.data.roles;
      this.arole = response.data.currole;
    });
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
  },
};
</script>

<style>
.selected {
  outline-style: solid;
  outline-color: #000000;
  outline-offset: -2px;
  outline-width: 2px;
}

.item {
  height: 70px !important;
}
</style>

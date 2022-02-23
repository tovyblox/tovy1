<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">Session #182</p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">Welcome to your home</p>
      </v-container>
    </v-sheet>
    <v-container class="mt-n16 mx-auto">
      <v-card  min-width="300" height="151" class="mb-n6" outlined>
        <v-img
          max-height="200"
          height="150"
          gradient="to bottom, rgba(255,255,255,0.3), rgba(255,255,255,1)"
          class="py-auto"
          :src="`https://tr.rbxcdn.com/0322ebe1e26eca7f692972aea1fe80ea/768/432/Image/Png`"
        >
          <v-layout>
            <div>
              <v-card-title class="mt-2">
                @ Imperial Hotels and Resorts | Training center
              </v-card-title>
            </div>
            <v-spacer />
          </v-layout>
          <v-card-actions>
            <v-btn class="my-auto mt-7 mr-2" plain color="success">
              Play <v-icon right dark> mdi-arrow-right </v-icon>
            </v-btn>
          </v-card-actions>
        </v-img>
      </v-card>
      <v-row class="mt-5" wrap>
        <v-col cols="12" sm="12" md="8" xl="10" order="last">
          <v-card height="109" outlined>
           
            <v-layout v-if="!loading" class="">
              <v-avatar
                class="my-auto rounded-l mr-3"
                :color="$store.state.group.color"
                tile
                size="108"
              >
                <v-img :src="$store.state.user.pfp"></v-img>
              </v-avatar>
              <div>
                <p class="grey--text mt-2"> Hosted by </p>
                <p class="text-h4 mt-n3 my-auto font-weight-bold">ItsWHOOOP</p>
              </div></v-layout
            ></v-card
          >
        </v-col>
        <v-col order="last">
          <v-card outlined class="">
            <v-card-title> Actions </v-card-title>
            <v-layout wrap class="py-4 ml-1 px-2 mt-n8" align="right">
              <v-btn color="success" class="mr-2 mt-2" @click="openpropt('add')" outlined>
                End session
              </v-btn>
            </v-layout>
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

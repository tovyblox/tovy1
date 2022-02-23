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
      <v-card ripple min-width="300" height="auto" class="mb-n6" outlined>
        <v-img
          max-height="100"
          height="78"
          gradient="to bottom, rgba(255,255,255,0.3), rgba(255,255,255,1)"
          class="py-auto"
          :src="`https://tr.rbxcdn.com/0322ebe1e26eca7f692972aea1fe80ea/768/432/Image/Png`"
        >
          <v-layout>
            <div @click="goto('/session/12')">
              <v-card-title class="my-auto">
                Training session
              </v-card-title>
              <v-card-text class="mt-n6">
                WHOOOP is hosting a training @ Impieral Hotels and Resorts
              </v-card-text>
            </div>
            <v-spacer @click="goto('/session/12')" />
            <v-btn class="my-auto mr-2" plain color="success">
              Play <v-icon right dark> mdi-arrow-right </v-icon>
            </v-btn>
          </v-layout>
        </v-img>
      </v-card>

      

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
  mounted() {
    
  },
  components: {
    
  },
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

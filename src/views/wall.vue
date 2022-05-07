<template>
  <div>
    <v-sheet :color="$store.state.group.color" height="200" style="width: 100%">
      <v-container>
        <p class="text-h4 font-weight-bold mt-14">
          Hi {{ this.$store.state.user.displayName }},
        </p>
        <p class="text-body-1 font-weight-bold mt-n5 gray">View the wall</p>
      </v-container>
    </v-sheet>
    <v-container class="mt-n16 mx-auto">
      <wall :ishome="false"> </wall>
    </v-container>
  </div>
</template>

<script>
import wall from '@/components/wall'
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: false,
    groups: "dog",
    update: {},
  }),
  components: {
    wall
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

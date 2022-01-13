<template>
  <v-container fluid class="d-flex flex-row align-start pa-0 align-stretch">
    <bar />
    <v-main>
      <slot />
    </v-main>
  </v-container>
</template>

<script>
import bar from "../components/bar.vue";
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: false,
    groups: "dog",
  }),
  components: {
    bar,
  },
};
</script>

<style>

html {
    overflow-y: auto 
}

</style>
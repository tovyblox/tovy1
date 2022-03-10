<template>
  <div>
    <v-container>
      <p class="text-h4 font-weight-bold mt-5">{{ info.name }}</p>
      <p class="grey--text mt-n4">{{ info.description }}</p>
      <v-tabs class="mb-n3" v-model="tab" color="orange">
        <v-tab href="#tab-1">Questions</v-tab>
        <v-tab href="#tab-2">Settings</v-tab>
      </v-tabs>
    </v-container>
    <v-divider> </v-divider>

    <v-tabs-items v-model="tab">
      <v-tab-item :key="1" :value="'tab-' + 1">
        <questioneditor></questioneditor>
      </v-tab-item>
      <v-tab-item :key="2" :value="'tab-' + 2">
        <v-container>
          <v-row>
            <v-col cols="4">
              <v-card outlined>
                <v-card-title> Job info </v-card-title>
                <v-text-field
                  class="mx-4 mt-n2"
                  v-model="info.name"
                  hide-details="auto"
                  outlined
                  label="Job name"
                >
                </v-text-field>
                <v-textarea
                  class="mx-4 mt-3 mb-4"
                  v-model="info.description"
                  hide-details="auto"
                  outlined
                  label="Job descirption"
                ></v-textarea>

                <v-btn text class="ml-4 mb-3 mt-n1" color="info"> Save </v-btn>
              </v-card></v-col
            >
          </v-row>
          <v-row class="mt-n3">
            <v-col cols="4">
              <v-card outlined>
                <v-card-title> Ranking </v-card-title>
                <v-card-text class="mt-n4">
                  Rank users when thier appliction has been approved</v-card-text
                >
                <div class="mx-4 mt-n5">
                  <v-switch label="Rank users when approved"> </v-switch>
                </div> </v-card
            ></v-col>
          </v-row>
          <v-row class="mt-n3">
            <v-col cols="4">
              <v-card outlined>
                <v-card-title> Danger, bitch </v-card-title>
                <v-card-text class="mt-n4">
                  You can delete your entire appliction here, thats the only point of this card </v-card-text
                >
                <v-btn class="ml-4 mb-5 mt-n1 elevation-0" color="error">
                  Delete job
                </v-btn>
              </v-card></v-col
            >
          </v-row>
        </v-container>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script>
import questioneditor from "@/views/applictions/questioneditor";

export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: false,
    groups: "dog",
    update: {},
    info: {
      name: "Head of tovy",
      description: "Apply for head, bitch",
    },
    selected: 0,
    tab: 0,
  }),
  mounted() {},
  components: {
    questioneditor,
  },
  methods: {},
};
</script>

<style>
span.grippy {
  content: "....";
  height: 50px;
  border-radius: 2px;
  display: inline-block;
  overflow: hidden;
  padding: 3px 4px;
  cursor: move;
  vertical-align: middle;
  font-size: 36px;
  letter-spacing: 2px;
  color: #000000;
}

.no-select {
  user-select: none;
}
span.grippy::after {
  content: "...";
}
.pointer {
  cursor: pointer;
}
</style>

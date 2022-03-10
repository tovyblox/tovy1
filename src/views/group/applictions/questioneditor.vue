<template>
  <v-container class="mx-auto">
    <v-card min-width="300" @click.stop="newq()" ripple outlined class="mb-3">
      <v-card-title> ➕ New question </v-card-title>
    </v-card>
    <draggable v-model="quetions" handle="span.grippy">
      <v-card
        v-for="(question, i) in quetions"
        outlined
        :key="i"
        :class="`mb-2 native hover`"
      >
        <span class="grippy ml-6 mb-n4 mt-n5" />
        <v-row class="mx-4 mt-5">
          <v-col cols="8">
            <v-text-field
              label="Question name"
              v-model="question.name"
              outlined
            ></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-select
              label="Type"
              class="mb-n6"
              :items="types"
              outlined
              v-model="question.type"
              item-text="text"
              item-value="value"
            />
          </v-col>
        </v-row>
        <p
          v-if="question.type == 'short_text'"
          class="mt-n6 mx-7 mb-n3 pb-2 grey--text text-decoration-underline no-select"
        >
          <v-text-field label="Short text here..." disabled outlined> </v-text-field>
        </p>

        <p
          v-if="question.type == 'text'"
          class="mt-n6 mx-7 mb-n3 pb-2 grey--text text-decoration-underline no-select"
        >
          <v-textarea label="Long text here..." disabled outlined> </v-textarea>
        </p>

        <p
          v-if="question.type == 'number'"
          class="mt-n6 mx-7 mb-n3 pb-2 grey--text text-decoration-underline no-select"
        >
          <v-text-field label="Number" disabled outlined> </v-text-field>
        </p>

        <div
          v-if="question.type == 'checkbox'"
          class="mt-n6 ml-7 pb-2 grey--text no-select"
        >
          <div class="mb-3 mt-n11">
            <v-row
              v-for="(answer, i) in question.answers"
              :key="i"
              align="center"
              class="mx-6 mt-n8"
            >
              <v-checkbox
                hide-details
                disabled
                class="shrink mr-2 ml-n5 mt-n1"
              ></v-checkbox>
              <v-col> <v-text-field v-model="answer.name"></v-text-field></v-col>
              <v-btn icon> <v-icon> mdi-delete </v-icon> </v-btn>
            </v-row>
          </div>
          <v-btn
            class="elevation-0 mt-n1 mb-3"
            color="info"
            @click="addquestion(question)"
          >
            Add checkbox
          </v-btn>
        </div>

        <div v-if="question.type == 'radio'" class="mt-n6 ml-7 pb-2 grey--text no-select">
          <div class="mb-3 mt-n11">
            <v-row
              v-for="(answer, i) in question.answers"
              :key="i"
              align="center"
              class="mx-6 mt-n8"
            >
              <v-radio hide-details disabled class="shrink mr-2 ml-n5 mt-n1"></v-radio>
              <v-col> <v-text-field v-model="answer.name"></v-text-field></v-col>
              <v-btn icon> <v-icon> mdi-delete </v-icon> </v-btn>
            </v-row>
          </div>
          <v-btn
            class="elevation-0 mt-n1 mb-3"
            color="info"
            @click="addquestion(question)"
          >
            Add raido
          </v-btn>
        </div>

        <div v-if="question.type == 'scale'" class="mt-n6 mx-6 pb-2 grey--text no-select">
          <div class="mb-1">
            <v-slider disabled max="10" min="0"></v-slider>
            <v-row>
              <v-col cols="4" class="mt-n3">
                <v-text-field
                  dense
                  outlined
                  label="Label"
                  v-model="question.label1"
                ></v-text-field>
              </v-col>
              <v-spacer />
              <v-col cols="4" class="mt-n3">
                <v-text-field
                  dense
                  outlined
                  label="Label"
                  v-model="question.label2"
                ></v-text-field>
              </v-col>
            </v-row>
          </div>
        </div>

        <v-divider></v-divider>

        <v-layout class="mx-3 my-3">
          <v-switch
            label="Required"
            v-model="question.required"
            class="my-1 ml-2 mb-n3"
          ></v-switch>
          <v-spacer></v-spacer>
          <v-btn icon class="my-auto">
            <v-icon @click="deleteq(i)"> mdi-delete </v-icon>
          </v-btn>
        </v-layout>
      </v-card>
    </draggable>
  </v-container>
</template>
<script>
import draggable from "vuedraggable";

export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: false,
    groups: "dog",
    update: {},
    selected: 0,
    tab: 0,
    types: [
      { text: "Long text", value: "text" },
      { text: "Short text", value: "short_text" },
      { text: "Number", value: "number" },
      { text: "Checkbox", value: "checkbox" },
      { text: "Radio", value: "radio" },
      { text: "Scale", value: "scale" },
    ],
    quetions: [
      {
        name: "What is your name",
        type: "short_text",
        required: false,
        id: 1932,
      },
      {
        name: "What is your meow",
        type: "radio",
        answers: [
          {
            name: "Meow",
            id: 1234,
          },
          {
            name: "Moo",
            id: 1235,
          },
        ],
        required: false,
        id: 3821,
      },
      {
        name: "how much do u luv tovy",
        type: "rating",
        required: true,
        id: 1921,
      },
    ],
  }),
  mounted() {},
  components: {
    draggable,
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    newq: function () {
      this.quetions.push({
        name: "Question #" + (this.quetions.length + 1),
        id: this.quetions.length + 1,
        type: "short_text",
        required: false,
      });
    },
    addquestion: function (question) {
      let q = {
        name: "Answer #" + (question.answers.length + 1),
        id: question.answers.length + 1,
      };
      console.log(q);
      question.answers ? question.answers.push(q) : (question.answers = [q]);
    },
    deleteq: function (i) {
      this.quetions.splice(i, 1);
      this.selected = i - 1;
    },
    open: function (url) {
      window.open(url);
    },
  },
};
</script>

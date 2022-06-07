<template>
  <div>
    <v-card @click="creation.active = true" ripple class="">
      <v-card-title> 📋 Create a book entry </v-card-title>
      <v-card-text class="mt-n6 mb-3"> Create a task for this user. </v-card-text>
    </v-card>
    <v-card class="mb-2" v-if="creation.active" outlined>
      <v-card-title> New book entry </v-card-title>
      <v-form class="mx-3 mb-6" ref="form" v-model="creation.valid">
        <v-select
          label="Type"
          class="mb-2"
          v-model="creation.type"
          hide-details="auto"
          outlined
          :rules="[(v) => !!v || 'You need to put in a type ']"
          :items="['Demotion', 'Fire', 'Note', 'Promotion', 'Suspention', 'Unsuspension']"
        >
        </v-select>
        <v-textarea v-model="creation.notes" outlined label="Notes" hide-details>
        </v-textarea>
      </v-form>
      <v-row class="mx-3 mt-n4 mb-3">
        <v-btn
          @click="creation.active = false"
          color="info"
          class="ml-auto elevation-0"
          text
        >
          Cancel
        </v-btn>
        <v-btn
          @click="addbook"
          color="success"
          class="ml-2 elevation-0"
          :disabled="!creation.valid"
        >
          Create
        </v-btn>
      </v-row></v-card
    >
    <v-card outlined class="mb-2" v-for="book in book" :key="book.id">
      <v-row class="mx-0 my-0"
        ><v-card-title> {{ book.type }} #{{ book.id }} </v-card-title>
        <v-btn icon @click="delbook(book)" class="mr-4 my-auto ml-auto">
          <v-icon> mdi-delete </v-icon></v-btn
        ></v-row
      >
      <v-card-text class="blue--text mt-n5 font-weight-bold"
        >Created {{ getDate(book.created) }}</v-card-text
      >
      <v-card-text class="mt-n8">{{ book.notes }}</v-card-text>
    </v-card>
    <v-snackbar v-model="toast.visible">
      {{ toast.message }}

      <template v-slot:action="{ attrs }">
        <v-btn :color="toast.color" text v-bind="attrs" @click="toast.visible = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script>
export default {
  naem: "book",
  data: () => ({
    creation: {
      active: false,
      type: "",
      notes: "",
      valid: true,
    },
    toast: {
      message: "",
      color: "success",
      visible: false,
    },
    book: [],
  }),
  async created() {
    this.$http.get(`/staff/book/${this.$route.params.id}`).then((res) => {
      this.book = res.data.books;
    });
  },
  methods: {
    async addbook() {
      this.$refs.form.validate();
      if (!this.creation.valid) return;
      this.$http
        .post("/staff/book/add", {
          type: this.creation.type,
          notes: this.creation.notes,
          userid: this.$route.params.id,
        })
        .then((res) => {
          this.creation.active = false;
          this.book.push(res.data.book);
          this.toast.message = "Book entry created";
          this.toast.color = "success";
          this.toast.visible = true;
        });
    },
    delbook(book) {
      this.$http.delete("/staff/book/" + book.id).then(() => {
        this.creation.active = false;
        this.book.splice(this.book.indexOf(book), 1);
        this.toast.message = "Book entry deleted";
        this.toast.color = "success";
        this.toast.visible = true;
      });
    },
    getDate: function (d) {
      let date = new Date(d);

      let time = date.toLocaleString("en", { weekday: "long" });
      let m = date.toLocaleString("en", { month: "long" });
      let day = date.getDate();
      return `${time} ${m}, ${day}th`;
    },
  },
};
</script>

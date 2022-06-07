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
      <v-card @click="newAutomation" ripple class="">
        <v-card-title> 🤖 Create automation </v-card-title>
        <v-card-text class="mt-n6 mb-3"> Create an automation. </v-card-text>
      </v-card>
      <v-card
        :elevation="0"
        v-for="(automation, i) of automations"
        :key="i"
        outlined
        class="mt-3"
      >
        <v-row
          v-ripple
          class="mx-0 my-0"
          style="cursor: pointer"
          @click="automation.visible = !automation.visible"
        >
          <v-card-title> {{ automation.name }}</v-card-title>
          <v-btn
            icon
            @click="del(automation)"
            class="mr-4 my-auto ml-auto"
          >
            <v-icon> mdi-delete </v-icon>
          </v-btn>
        </v-row>

        <v-expand-transition>
          <div v-show="automation.visible">
            <automationEditor v-model="automations[i]" />
          </div>
        </v-expand-transition>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import automationEditor from "@/views/automationEditor";
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: false,
    groups: "dog",
    update: {},
    automations: [],
  }),
  components: {
    automationEditor,
  },
  mounted() {
    this.$http.get("/settings/automations").then((res) => {
      this.automations = res.data.automations.map((a) => ({ ...a, visible: false }));
    });
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },

    newAutomation() {
      this.$http.post("/settings/automation/new").then((response) => {
        console.log('uwu')
        response.data.automation.visible = true;
        this.automations.push(response.data.automation);
      });
    }, 
    del(automation) {
      this.$http.delete("/settings/automation/" + automation.id).then(() => {
        this.automations.splice(this.automations.indexOf(automation), 1);
      });
    },
    open: function (url) {
      window.open(url);
    },
  },
};
</script>

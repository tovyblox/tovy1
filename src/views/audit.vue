<template>
  <div>
    <v-container>
      <p class="text-h4 font-weight-bold mt-14">Audit</p>
    </v-container>
    <v-container class="= mx-auto">
      <v-data-iterator
        :items="logs"
        :footer-props="{ 'items-per-page-options': [15, 30, -1] }"
        :items-per-page="15"
      >
        <template v-slot:default="{ items }">
          <v-list one-line v-for="(log, i) in items" :key="i">
            <template>
              <v-list-item>
                <v-list-item-avatar v-if="!log.automation" style="cursor: pointer">
                  <v-img style="cursor: pointer" :src="log.user.pfp"></v-img>
                </v-list-item-avatar>

                <v-list-item-content style="cursor: pointer">
                  <p class="my-auto">
                    <vue-simple-markdown
                      :source="`${!log.automation ? `**${log.user.username}**`: ''} ${log.message}`"
                    ></vue-simple-markdown>
                  </p>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </template>
      </v-data-iterator>
    </v-container>
  </div>
</template>
<script>
export default {
  name: "Audit",
  data: () => ({
    drawer: true,
    loading: false,
    groups: "dog",
    update: {},
    logs: [],
  }),
  components: {},
  methods: {},
  mounted() {
    this.$http.get("/staff/audit").then((response) => {
      this.logs = response.data.logs;
    });
  },
};
</script>

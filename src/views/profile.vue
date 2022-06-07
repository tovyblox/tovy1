<template>
  <div>
    <v-container>
      <v-layout v-if="!loading" class="mt-12">
        <v-avatar
          class="my-auto ml-3 mr-3"
          :color="$store.state.group.color"
          size="80"
        >
          <v-img :src="data.pfp"></v-img>
        </v-avatar>
        <div class="my-auto">
          <p class="text-h4 my-auto font-weight-bold">
            {{ data.info.displayName }}
          </p>

          <p
            v-if="data.username != data.info.displayName"
            class="text-body-1 mt-n1 grey--text gray"
          >
            @{{ data.username }}
          </p>
        </div></v-layout
      >
      <v-tabs class="mt-7 mb-n3" v-model="tab" color="red darken-2">
        <v-tab href="#tab-1">Acivity</v-tab>
        <v-tab href="#tab-2">Bans</v-tab>
        <v-tab href="#tab-3">Book</v-tab>
      </v-tabs>
    </v-container>
    <v-divider class=" mb-5"></v-divider>
    <v-container>
      <v-card v-if="loading" outlined>
        <v-row class="mx-auto mb-5 mt-5">
          <v-progress-circular
            :size="50"
            color="amber"
            class="mx-auto"
            indeterminate
          ></v-progress-circular>
          <v-card-text class="text-center mt-2 mt-n2 mb-n5"> Loading... </v-card-text>
        </v-row></v-card
      >
      <v-tabs-items v-model="tab" v-if="!loading">
        <v-tab-item :key="1" :value="'tab-' + 1">
          <activityTab class="mx-1"/>
        </v-tab-item>
         <v-tab-item :key="2" :value="'tab-' + 2">
          <banTab class="mx-1"/>
        </v-tab-item>
         <v-tab-item :key="3" :value="'tab-' + 3">
          <bookTab class="mx-1"/>
        </v-tab-item>
        </v-tabs-items>
      

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
import activityTab from "@/components/profile/activityTab";
import banTab from '@/components/profile/banTab'
import bookTab from '@/components/profile/bookTab'

export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: true,
    valid: true,
    groles: [],
    srole: null,
    tab: 1,
    reason: "",
    ban: null,
  
    resetting: false,
    banp: {
      visible: false,
      value: null,
      loading: false,
      valid: false,
    },
    groups: "dog",
    data: {},
    stats: {},
    toast: {
      message: "",
      color: "success",
      visible: false,
    },
    activity: [],
  }),
  components: { activityTab, banTab, bookTab },
  mounted: function () {
    this.$http
      .get("/staff/uprofile/" + this.$route.params.id, {
        withCredentials: true,
      })
      .then((response) => {
        this.data = response.data;
        this.loading = false;
      });
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    getTime: function (d) {
      let date = new Date(d);
      //get time in date
      let time = date.getMinutes();
      let hour = date.getHours();
      return `${hour}:${time}`;
    },
    firsu: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
  },
};
</script>

<style>
.selected {
  outline-style: solid;
  outline-color: #1976d2;
  outline-offset: -2px;
  outline-width: 2px;
}

.item {
  height: 70px !important;
}
</style>

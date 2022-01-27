<template>
  <div>
    <v-container>
      <p class="text-h4 font-weight-bold mt-14">Staff</p>
    </v-container>
    <v-container>
      <v-layout wrap class="mb-7">
        <v-btn
          class="my-auto mr-2 mt-2"
          v-if="selected().length != data.length"
          @click="selectall"
          elevation="0"
          color="success"
        >
          Select all
        </v-btn>
        <v-btn
          class="my-auto mr-2 mt-2"
          v-if="selected().length"
          @click="deselectall"
          elevation="0"
          color="success"
        >
          Deslect all
        </v-btn>
        <v-btn
          class="my-auto mr-2 mt-2"
          :disabled="!selected().length"
          elevation="0"
          @click="openpropt('reset')"
          color="info"
        >
          Activity reset selected
        </v-btn>
        <v-btn
          class="my-auto mr-2 mt-2"
          :disabled="!selected().length"
          elevation="0"
          @click="openpropt('add')"
          color="info"
        >
          Add activity
        </v-btn>
        <v-btn
          class="my-auto mr-2 mt-2"
          :disabled="!selected().length"
          elevation="0"
          @click="openpropt('remove')"
          color="info"
        >
          Remove activity
        </v-btn>
        <v-spacer> </v-spacer>

        <v-select
          :items="groles"
          v-model="srole"
          @change="updatemembers"
          dense
          class="my-auto mt-2"
          style="max-width: 200px"
          outlined
          hide-details="auto"
          item-value="rank"
          item-text="name"
          disable-items-per-page
        >
        </v-select>
      </v-layout>
      <v-data-iterator
        v-if="srole && !loading"
        :items="data"
        :footer-props="{ 'items-per-page-options': [24, 48, -1] }"
        :items-per-page="24"
      >
        <template v-slot:default="{ items }">
          <v-row align="center">
            <v-col
              v-for="item in items"
              :key="item.username"
              cols="12"
              class="mt-n4"
              sm="6"
              md="4"
              lg="3"
              ><v-card outlined :class="`py-n1 ${item.selected ? 'selected' : ''}`">
                <div v-ripple>
                  <v-layout @click.stop="item.selected = !item.selected">
                    <v-avatar
                      class="my-auto ml-3 mr-n2"
                      :color="$store.state.group.color"
                      size="36"
                    >
                      <v-img :src="item.pfp"></v-img>
                    </v-avatar>
                    <div>
                      <v-card-title> {{ item.displayName }}</v-card-title>
                      <v-card-text class="mt-n6 grey--text"
                        >@{{ item.username }}</v-card-text
                      >
                    </div></v-layout
                  >
                </div>
                <v-divider></v-divider>
                <v-layout wrap class="py-2 px-2" align="right">
                  <v-btn color="success" plain @click="goto(`/profile/${item.userId}`)">
                    View profile
                  </v-btn>
                  
                </v-layout>
              </v-card></v-col
            ></v-row
          ></template
        >
      </v-data-iterator>
      <v-card v-if="!srole" outlined>
        <v-row class="mx-auto mb-5 mt-5">
          <v-img
            src="../assets/experimental-sleepy-tiger-coming-out-of-the-cave-in-the-morning.png"
            class="mx-auto mt-7"
            width="300"
            max-width="400"
          ></v-img>
          <v-card-text class="text-center mt-n5 mb-n4">
            Please choose a role from the dropdown first
          </v-card-text>
        </v-row></v-card
      >

      <v-card v-if="loading" outlined>
        <v-row class="mx-auto mb-5 mt-5">
          <v-progress-circular
            :size="50"
            color="amber"
            class="mx-auto"
            indeterminate
          ></v-progress-circular>
          <v-card-text class="text-center mt-2 mt-n2 mb-n5">
            Loading some users!
          </v-card-text>
        </v-row></v-card
      >

      <v-snackbar v-model="toast.visible">
        {{ toast.message }}

        <template v-slot:action="{ attrs }">
          <v-btn :color="toast.color" text v-bind="attrs" @click="toast.visible = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>

      <v-dialog v-model="prompt.visible" max-width="400">
        <v-card v-if="prompt.type == 'reset'" :loading="prompt.loading">
          <v-card-title
            >Reset actvity
          </v-card-title>
          <v-card-text class="mt-n3">
            Are you sure you want to reset the activity of the selected users? This action is irrvesible
          </v-card-text>
          <v-btn
            elevation="0"
            :disabled="prompt.loading"
            @click="resetactivity"
            class="mb-4 mr-6 mt-n1 mx-6"
            color="success"
          >
            Submit
          </v-btn>
          <v-btn
            elevation="0"
            class="mb-4 mr-6 mt-n1 float-right"
            @click="prompt.visible = false"
            :disabled="prompt.loading"
            plain
            color="info"
          >
            Cancel
          </v-btn>
        </v-card>

        <v-card v-else :loading="prompt.loading">
          <v-card-title
            >{{ prompt.type.charAt(0).toUpperCase() + prompt.type.slice(1) }} actvity
          </v-card-title>

          <v-form ref="form" class="mt-n1 mx-6" v-model="prompt.valid" lazy-validation>
            <v-text-field
              outlined
              v-model="prompt.value"
              hide-details="auto"
              :disabled="prompt.loading"
              label="Amount"
              required
              class="mb-3"
              :rules="[
                (v) => !!v || 'Amount is required',
                (v) => !!parseInt(v) || 'Must be a number',
              ]"
            ></v-text-field>
            <v-btn
              elevation="0"
              :disabled="prompt.loading"
              @click="updateactivity"
              class="mb-4 ml-auto"
              color="success"
            >
              Submit
            </v-btn>
            <v-btn
              elevation="0"
              class="mb-4 ml-auto float-right"
              @click="prompt.visible = false"
              :disabled="prompt.loading"
              plain
              color="info"
            >
              Cancel
            </v-btn>
          </v-form>
        </v-card>
      </v-dialog>

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
export default {
  name: "HelloWorld",

  data: () => ({
    drawer: true,
    loading: false,
    valid: true,
    groles: [],
    srole: null,
    groups: "dog",
    headers: [
      { text: "Username", value: "username" },
      { text: "Status", value: "status" },
      { text: "Minuites in game", value: "min" },
    ],
    prompt: {
      type: "",
      visible: false,
      value: null,
      loading: false,
      valid: false,
    },
    toast: {
      message: "",
      color: "success",
      visible: false,
    },

    data: [],
  }),
  components: {},
  mounted: function () {
    this.$http.get("/group/roles", { withCredentials: true }).then((response) => {
      this.groles = response.data.roles.splice(1);
    });
  },
  methods: {
    goto: function (url) {
      this.$router.push(url);
    },
    openpropt: function (type) {
      this.prompt.type = type;
      this.prompt.visible = true;
    },
    selected: function () {
      return this.data.filter((item) => item.selected);
    },
    selectall: function () {
      for (let ob of this.data) {
        ob.selected = true;
      }
    },
    deselectall: function () {
      for (let ob of this.data) {
        ob.selected = false;
      }
    },
    updateactivity: function () {
      this.prompt.loading = true;
      this.$http
        .post(
          "/mactivity/change",
          {
            mins: this.prompt.value,
            users: this.data.filter((item) => item.selected).map((item) => item.userId),
            type: this.prompt.type,
          },
          { withCredentials: true }
        )
        .then(() => {
          this.prompt.loading = false;
          this.toast.message = "Activity updated";
          this.toast.visible = true;
          this.prompt.visible = false;
        });
    }, resetactivity: function () {
      this.prompt.loading = true;
      this.$http
        .post(
          "/mactivity/reset",
          {
            users: this.data.filter((item) => item.selected).map((item) => item.userId),
          },
          { withCredentials: true }
        )
        .then(() => {
          this.prompt.loading = false;
          this.toast.message = "Activity reset";
          this.toast.visible = true;
          this.prompt.visible = false;
        });
    },
    updatemembers: function () {
      this.loading = true;
      this.$http
        .get("/group/members?role=" + this.srole, { withCredentials: true })
        .then((response) => {
          this.data = response.data.members;
          this.loading = false;
        });
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

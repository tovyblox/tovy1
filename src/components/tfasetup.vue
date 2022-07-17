<template>
  <div>
    <v-row>
      <v-dialog
        @click:outside="close"
        v-if="$store.state.user['2fa']"
        max-width="500px"
        v-model="value"
      >
        <v-card>
          <v-card-title>Disable 2fa</v-card-title>
          <v-window class="mt-n8" v-model="slide" reverse>
            <v-window-item>
              <v-card-text class="grey--text mx-2">
                Please enter the two-factor code you got from your
                authenticator</v-card-text
              >
              <div class="mx-6">
                <v-otp-input
                  @input="invalid = false"
                  length="6"
                  v-model="code"
                ></v-otp-input>
                <p class="red--text" v-if="invalid">That code was invalid</p>
              </div>
              <v-card-actions>
                <v-spacer />
                <v-btn text color="info" @click="close"> Cancel </v-btn>
                <v-btn text color="success" @click="disable">
                  Next
                </v-btn></v-card-actions
              >
            </v-window-item>
            <v-window-item>
              <v-card-text class="grey--text mx-2">
                2fa disabled! You can now close the window</v-card-text
              >
              <v-card-actions>
                <v-spacer />
                <v-btn text color="success" @click="close">
                  Close
                </v-btn></v-card-actions
              >
            </v-window-item>
          </v-window></v-card
        ></v-dialog
      >

      <v-dialog
        @click:outside="close"
        v-if="!$store.state.user['2fa']"
        max-width="500px"
        v-model="value"
      >
        <v-card>
          <v-card-title>Setup 2fa</v-card-title>
          <v-window class="mt-n8" v-model="slide" reverse>
            <v-window-item>
              <v-card-text class="grey--text mx-2 mt-1">
                2fa is a secure way to make sure that your account stays safe by making
                you use your authenticator app everytime you want to login</v-card-text
              >
              <v-card-actions>
                <v-spacer />
                <v-btn text color="success" @click="getstarted">
                  Next
                </v-btn></v-card-actions
              >
            </v-window-item>
            <v-window-item>
              <v-card-text class="grey--text mx-2">
                Scan the QR code below to add to your authenticator app</v-card-text
              >
              <v-img :src="qrcode" class="mx-auto" height="200px" width="200px"> </v-img>
              <v-row class="my-2">
                <v-btn
                  class="mx-auto elevation-0"
                  color="info"
                  v-if="!showsecret"
                  @click="showsecret = true"
                >
                  View secret
                </v-btn>
                <p
                  class="mx-auto mt-2 mb-1"
                  v-if="showsecret"
                  style="cursor: pointer"
                  @click="showsecret = false"
                >
                  {{ secret }}
                </p></v-row
              >
              <v-card-actions>
                <v-spacer />
                <v-btn text color="success" @click="slide = 2">
                  Next
                </v-btn></v-card-actions
              >
            </v-window-item>
            <v-window-item>
              <v-card-text class="grey--text mx-2">
                Enter the code you got with your authenticator</v-card-text
              >
              <div class="mx-6">
                <v-otp-input
                  @input="invalid = false"
                  length="6"
                  v-model="code"
                ></v-otp-input>
                <p class="red--text" v-if="invalid">That code was invalid</p>
              </div>
              <v-card-actions>
                <v-spacer />
                <v-btn text color="info" @click="slide = 1"> Back </v-btn>
                <v-btn text color="success" @click="confirm2fa">
                  Next
                </v-btn></v-card-actions
              >
            </v-window-item>
            <v-window-item>
              <v-card-text class="grey--text mx-2">
                Setup done! You may now close the window</v-card-text
              >
              <v-card-actions>
                <v-spacer />
                <v-btn text color="success" @click="close">
                  Close
                </v-btn></v-card-actions
              >
            </v-window-item>
          </v-window></v-card
        ></v-dialog
      >
    </v-row>
  </div>
</template>
<script>
export default {
  name: "tfasetup",
  props: ["value"],
  data: () => ({
    has2fa: false,
    showsecret: false,
    invalid: false,
    slide: 0,
    qrcode: "",
    code: "",
    secret: "",
  }),
  methods: {
    async getstarted() {
      let req = await this.$http.post("/setup2fa", {});
      let data = req.data;
      this.qrcode = data.qr;
      this.secret = data.secret;
      this.slide = 1;
    },
    close() {
      this.slide = 0
      this.$emit("close");
  
    },
    async confirm2fa() {
      try {
        await this.$http.post("/confirm2fa", {
          code: this.code,
        });
      } catch (e) {
        console.log(e);
        this.invalid = true;
        return;
      }
      this.slide = 3;
      this.close();
      this.$store.commit("set2fa", true);
    },
    async disable() {
      try {
         await this.$http.post("/turnoff2fa", {
          code: this.code,
        });
      } catch (e) {
        console.log(e);
        this.invalid = true;
        return;
      }
      this.slide = 3;
      this.close()
      this.$store.commit("set2fa", false);
    },
  }
};
</script>

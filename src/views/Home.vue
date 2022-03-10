<template>
  <div>
    <v-sheet color="blue lighten-1" height="200" style="width: 100%">
      <v-container>
        <v-layout class="mt-14">
          <div class="white--text">
            <p class="text-h4 font-weight-bold">Hi {{ this.$store.state.user.displayName }},</p>
            <p class="text-body-1 font-weight-bold mt-n6 gray">Welcome to tovy</p>
          </div>
        </v-layout>
      </v-container>
    </v-sheet>
    <v-container>
      <v-row class="mt-n16">
        <v-col order="last">
          <v-card min-width="300" ripple outlined class="mb-n4">
            <v-card-title> Create group </v-card-title>
            <v-card-text class="mt-n6"> Create a group on Tovy </v-card-text>
          </v-card>
        </v-col>
        <v-col order="last">
          <v-card min-width="300" ripple outlined class="mb-2">
            <v-card-title> Join group </v-card-title>
            <v-card-text class="mt-n6"> Join a group with a code on Tovy </v-card-text>
          </v-card>
        </v-col>
      </v-row> 

      <v-row class="mt-2">
        <v-col order="last" col="12" sm="6" xl="3" md="4">
          <v-card to="/group/home" min-width="100" ripple outlined class="mb-n4">
            <v-img height="150" src="https://tr.rbxcdn.com/b5a4da897d0335b05852804a08f2b630/150/150/Image/Png"> </v-img>
            <v-card-title> Imperial Hotels</v-card-title>
          </v-card>
        </v-col>
        
        <v-col order="last" col="12" sm="6" xl="3" md="4">
          <v-card min-width="100" ripple outlined class="mb-n4">
            <v-img height="150" src="https://tr.rbxcdn.com/95d3c5c8364d29f267a27dc23df80404/150/150/Image/Png"> </v-img>
            <v-card-title> Group Recruiting Plaza </v-card-title>
          </v-card>
        </v-col>
        <v-col order="last" col="12" xs="12" sm="6" xl="3" md="4">
          <v-card min-width="100" ripple outlined class="mb-n4">
            <v-img height="150" src="https://tr.rbxcdn.com/4a606cd779ece6c013278c118482cd2e/150/150/Image/Png"> </v-img>
            <v-card-title> Alternative Universal </v-card-title>
          </v-card>
        </v-col>
        <v-col order="last" col="12" xs="12" sm="6" xl="3" md="4">
          <v-card min-width="100" ripple outlined class="mb-n4">
            <v-img height="150" src="https://tr.rbxcdn.com/f00b2ca41e2ddba223d03f3b9a07874a/768/432/Image/Png"> </v-img>
            <v-card-title> RoLabs </v-card-title>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "Home",

  components: {},
};
</script>

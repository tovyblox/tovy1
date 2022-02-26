<template>
  <div>
    <v-timeline dense clipped>
      <div v-for="(item, i) in data" :key="i">
        <template v-if="item.type == 'IA'">
          <v-timeline-item icon="mdi-clipboard">
            <v-row class="my-auto">
              <v-col cols="7">
                <v-chip class="white--text mr-2" color="orange" label small>
                  Inactivity
                </v-chip>

                <v-chip
                  v-if="item.status == 'none'"
                  class="white--text ml-0"
                  color="purple"
                  label
                  small
                >
                  Processing...
                </v-chip>
                <v-chip
                  v-if="item.status == 'denied'"
                  class="white--text ml-0"
                  color="error"
                  label
                  small
                >
                  Denied
                </v-chip>
                <v-chip
                  v-if="item.status == 'accepted'"
                  class="white--text ml-0"
                  color="success"
                  label
                  small
                >
                  Accepted
                </v-chip>

                {{ item.reason }}
              </v-col>
              <v-col class="text-right" cols="5">
                {{ getDate(item.start) }} to {{ getDate(item.end) }}
              </v-col>
            </v-row>
          </v-timeline-item>
        </template>
        <template v-if="item.type == 'session'">
          <v-timeline-item icon="mdi-clock">
            <v-row class="my-auto">
              <v-col cols="7"> {{ getTimeRange(item.start, item.end) }} ingame </v-col>
              <v-col class="text-right" cols="5">
                {{ getTime(item.start) }} to {{ getTime(item.end) }} on
                {{ getDate(item.start) }}
              </v-col>
            </v-row>
          </v-timeline-item>
        </template>

        <template v-if="item.type == 'add'">
          <v-timeline-item icon="mdi-gift">
            <v-row class="my-auto">
              <v-col cols="7"> {{ item.mins }} minutes were added </v-col>
              <v-col class="text-right" cols="5">
                {{ getDate(item.start) }}
              </v-col>
            </v-row>
          </v-timeline-item>
        </template>

        <template v-if="item.type == 'remove'">
          <v-timeline-item icon="mdi-minus">
            <v-row class="my-auto">
              <v-col cols="7"> {{ Math.abs(item.mins) }} minutes were removed </v-col>
              <v-col class="text-right" cols="5">
                {{ getDate(item.start) }}
              </v-col>
            </v-row>
          </v-timeline-item>
        </template>
      </div>
    </v-timeline>
  </div>
</template>

<script>
import _ from "lodash";
export default {
  name: "Dee",
  props: {
    data: Array,
  },
  data: () => ({
    s: [],
  }),

  created: function () {
    const vm = this;
    let data = vm.data;
    console.log(data.filter((e) => e.type == "session"));
    //let sessions = []

    let d = _.groupBy(data, (item) => {
      return `${item.type}_${new Date(item.start).toDateString()}`;
    });

    this.s = d;
  },
  methods: {
    getTime: function (d) {
      let date = new Date(d);
      //get time in date
      let time = date.getMinutes();
      let hour = date.getHours();
      return `${hour}:${time}`;
    },
    getDate: function (d) {
      let date = new Date(d);

      //get time in date
      let time = date.toLocaleString("en", { weekday: "long" });
      let m = date.toLocaleString("en", { month: "long" });
      let day = date.getDate();
      return `${time} ${m}, ${day}th`;
    },
    getThing: function (thing) {
      return thing.split("_");
    },
    getcur: function () {
      let current = new Date();
      return current.toISOString().substring(0, 10);
    },
    getTimeRange: function (d, d2) {
      let date = new Date(d);
      let date2 = new Date(d2);
      var diffMs = date2 - date;
      var diffHrs = Math.floor((diffMs % 86400000) / 3600000); 
      var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); 
      if (!diffHrs) {
        return `${diffMins} minutes`;
      } else {
        return `${diffHrs} hour, ${diffMins} minutes`;
      }
    },
  },
};
</script>

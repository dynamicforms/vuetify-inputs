<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Hexagon Palette Example</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <df-color
              v-model="color"
              label="6 levels"
              picker="hexagon"
              :lightness-levels="6"
              @preview="previewColor = $event"
            />
          </v-col>
          <v-col cols="12" md="6">
            <df-color v-model="fullRangeColor" label="Full lightness range" picker="hexagon" />
          </v-col>
          <v-col cols="12" md="6">
            <df-color v-model="twoColor" label="2 levels" picker="hexagon" :lightness-levels="[0.4, 0.7]" />
          </v-col>
          <v-col cols="12" md="6">
            <df-color v-model="fifteenColor" label="15 levels" picker="hexagon" :lightness-levels="15" />
          </v-col>
          <v-col cols="12" md="6">
            <df-color v-model="barColor" label="21 levels" picker="hexagon" :lightness-levels="21" />
          </v-col>
          <v-col cols="12" md="6">
            <div class="preview" :style="{ backgroundColor: previewColor ?? color }">
              {{ previewColor ?? color }}
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { DfColor } from '../../src';

const color = ref('#3f8fd2');
const previewColor = ref<string | null>(null);
const fullRangeColor = ref('#c0504d');
const barColor = ref('#4f81bd');
const fifteenColor = ref('#9bbb59');
const twoColor = ref('#8064a2');
</script>

<style scoped>
.demo-container {
  margin-bottom: 20px;
}

.preview {
  height: 56px;
  border-radius: 4px;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  color: #fff;
  text-shadow: 0 0 2px #000;
}
</style>

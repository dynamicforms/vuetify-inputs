<template>
  <div class="demo-container">
    <v-card>
      <v-card-title>Web-safe Color Example</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <df-color
              v-model="color"
              label="Web-safe color"
              :alpha="false"
              :normalize="webSafe"
              @preview="previewColor = $event"
            />
          </v-col>
          <v-col cols="12" md="6">
            <div class="preview" :style="{ backgroundColor: previewColor ?? color }">
              {{ previewColor ?? 'No preview' }}
            </div>
          </v-col>
        </v-row>

        <div class="mt-4">
          <strong>Value:</strong>
          {{ color }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { DfColor } from '../../src';

const color = ref('#336699');
const previewColor = ref<string | null>(null);

// rounds each channel to the nearest multiple of 0x33
function webSafe(value: string): string {
  let hex = value.replace('#', '');
  if (hex.length === 3) hex = [...hex].map((digit) => digit + digit).join('');
  const channels = [0, 2, 4].map((start) => Math.round(parseInt(hex.slice(start, start + 2), 16) / 0x33) * 0x33);
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}
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

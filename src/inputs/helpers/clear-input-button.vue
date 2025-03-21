<template>
  <div class="field-clear-icon" @click="clear" @keyup.delete="clear">
    <IonIcon name="trash-outline"/>
  </div>
</template>

<script setup lang="ts">
import IonIcon from 'vue-ionicon';

const emits = defineEmits<{
  clearButtonPressed: [value: void];
}>();

// methods
function clear() {
  emits('clearButtonPressed');
}

</script>

<template>
  <div
    v-if="actionsRef.length > 0"
    class="text-end"
    :class="{
      'button-group': showAsGroup === 'grouped' || showAsGroup === 'grouped-no-borders',
      'with-border': showAsGroup === 'grouped',
    }"
  >
    <v-btn
      v-for="(action, idx) in actionsWithBreakpoint"
      :key="idx"
      :variant="action.renderAs === ActionDisplayStyle.BUTTON ? 'tonal' : 'text'"
      :elevation="0"
      :size="buttonSize"
      @click.stop="(event: MouseEvent) => action.action.execute(event)"
    >
      <cached-icon v-if="action.icon" :name="action.icon"/>
      <span v-if="action.icon && action.label" style="width: .5rem"/>
      <span v-if="action.label">{{ action.label }}</span>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { DfActionsProps } from './dynamicforms-component-props';
import { ActionDisplayStyle, useBreakpoint } from './helpers';

const props = withDefaults(defineProps<DfActionsProps>(), {
  buttonSize: 'default',
  showAsGroup: 'no',
});

const breakpoint = useBreakpoint();
const actionsRef = computed(() => unref(props.actions));
const actionsWithBreakpoint = computed(() => actionsRef.value.map((action) => ({
  action,
  ...unref(action.getBreakpointValue(breakpoint)),
})));
</script>

<style scoped>
.button-group {
  border-radius: .5em;
  /* the following two make the container fit the small buttons. without them there would be a top margin */
  line-height: 0;
  height: fit-content;
}
.button-group .v-btn {
  border: none;
  border-radius: 0;
  margin: 0 !important;
  padding: 0 .25em;
}
.button-group .v-btn:first-child {
  border-start-start-radius: .5em;
  border-end-start-radius: .5em;
}
.button-group .v-btn:last-child {
  border-start-end-radius: .5em;
  border-end-end-radius: .5em;
}
.button-group.with-border {
  border: .1em solid currentColor;
}
.button-group.with-border .v-btn:not(:first-child) {
  border-inline-start: .1em solid currentColor;
}
.v-btn:not(:first-child) {
  margin-left: .5em;
}
</style>

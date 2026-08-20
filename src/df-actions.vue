<template>
  <div
    v-if="actionsRef.length > 0"
    class="text-end df-actions"
    :class="{
      'button-group': showAsGroup === 'grouped' || showAsGroup === 'grouped-no-borders',
      'with-border': showAsGroup === 'grouped',
    }"
  >
    <v-btn
      v-for="(action, idx) in actionsWithBreakpoint"
      :key="idx"
      :variant="action.renderAs === ActionDisplayStyle.BUTTON ? 'tonal' : 'text'"
      :color="defaultActionColor(action.value)"
      :disabled="!action.action.effectiveEnabled || action.action.busy"
      :loading="action.action.busy"
      :elevation="0"
      :size="buttonSize"
      :class="{
        'd-none': action.action.visibility === DisplayMode.HIDDEN,
        invisible: action.action.visibility === DisplayMode.INVISIBLE,
      }"
      v-bind="action.value.passthroughAttrs"
      @click.stop="(event: MouseEvent) => action.action.execute(event)"
    >
      <cached-icon v-if="action.icon" :name="action.icon" />
      <span v-if="action.icon && action.label" style="width: 0.5rem" />
      <span v-if="action.label">{{ action.label }}</span>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { DisplayMode } from '@dynamicforms/vue-forms';
import { computed, unref } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { DfActionsProps } from './dynamicforms-component-props';
import { ActionDisplayStyle, ActionRenderOptions, getRenderOptionsForBreakpoint, useBreakpoint } from './helpers';

const props = withDefaults(defineProps<DfActionsProps>(), {
  buttonSize: 'default',
  showAsGroup: 'no',
});

const breakpoint = useBreakpoint();
const actionsRef = computed(() => unref(props.actions).filter((action) => action.visibility !== DisplayMode.SUPPRESS));
// What each button draws is read off the action's value rather than through the accessors this library's `Action`
// adds over it, so an action declared as a `@dynamicforms/vue-forms` one - which declares none of them - is drawn
// as well. `value` is the value as it stands, which is where the members no breakpoint resolves are read from;
// the spread is that same value resolved at the current breakpoint.
const actionsWithBreakpoint = computed(() =>
  actionsRef.value.map((action) => ({
    action,
    value: action.value as ActionRenderOptions,
    ...getRenderOptionsForBreakpoint(action.value, breakpoint.value),
  })),
);

function defaultActionColor(value: ActionRenderOptions): string | undefined {
  if (value.defaultConfirm) return 'primary';
  if (value.defaultReject) return 'secondary';
  return undefined;
}
</script>

<style>
.df-actions.button-group {
  border-radius: 0.5em;
  /* the following two make the container fit the small buttons. without them there would be a top margin */
  line-height: 0;
  height: fit-content;
}
.df-actions.button-group .v-btn {
  border: none;
  border-radius: 0;
  margin: 0 !important;
  padding: 0 0.25em;
}
.df-actions.button-group .v-btn:first-child {
  border-start-start-radius: 0.5em;
  border-end-start-radius: 0.5em;
}
.df-actions.button-group .v-btn:last-child {
  border-start-end-radius: 0.5em;
  border-end-end-radius: 0.5em;
}
.df-actions.button-group.with-border {
  border: 0.1em solid currentColor;
}
.df-actions.button-group.with-border .v-btn:not(:first-child) {
  border-inline-start: 0.1em solid currentColor;
}
.df-actions .v-btn:not(:first-child) {
  margin-left: 0.5em;
}
</style>

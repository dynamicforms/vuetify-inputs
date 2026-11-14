<template>
  <div
    v-if="actionsRef.length > 0"
    class="text-end df-actions"
    :class="{
      'df-actions--simple': simple,
      'button-group': showAsGroup === 'grouped' || showAsGroup === 'grouped-no-borders',
      'with-border': showAsGroup === 'grouped',
    }"
  >
    <template v-if="simple">
      <button
        v-for="(action, idx) in actionsWithBreakpoint"
        :key="idx"
        type="button"
        class="df-action-simple"
        :disabled="!action.action.executable"
        :aria-busy="action.action.busy ? 'true' : undefined"
        :class="visibilityClasses(action)"
        :aria-label="action.showLabel ? undefined : action.accessibleLabel"
        :title="action.showLabel ? undefined : action.accessibleLabel"
        v-bind="action.passthroughAttrs"
        @click.stop="(event: MouseEvent) => action.action.execute(event)"
      >
        <cached-icon v-if="action.icon" :name="action.icon" />
        <span v-if="action.label">{{ action.label }}</span>
      </button>
    </template>
    <template v-else>
      <v-btn
        v-for="(action, idx) in actionsWithBreakpoint"
        :key="idx"
        :variant="action.renderAs === 'button' ? 'tonal' : 'text'"
        :color="defaultActionColor(action)"
        :disabled="!action.action.executable"
        :loading="action.action.busy"
        :elevation="0"
        :size="buttonSize"
        :density="buttonDensity"
        :class="visibilityClasses(action)"
        :aria-label="action.showLabel ? undefined : action.accessibleLabel"
        :title="action.showLabel ? undefined : action.accessibleLabel"
        v-bind="action.passthroughAttrs"
        @click.stop="(event: MouseEvent) => action.action.execute(event)"
      >
        <cached-icon v-if="action.icon" :name="action.icon" />
        <span v-if="action.icon && action.label" style="width: 0.5rem" />
        <span v-if="action.label">{{ action.label }}</span>
      </v-btn>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Action } from '@dynamicforms/vue-forms';
import { computed, unref } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { DfActionsProps } from './dynamicforms-component-props';
import { ActionRenderOptions, getRenderOptionsForBreakpoint, useBreakpoint } from './helpers';

const props = withDefaults(defineProps<DfActionsProps>(), {
  buttonSize: 'default',
  buttonDensity: 'default',
  showAsGroup: 'no',
  simple: false,
});

const breakpoint = useBreakpoint();
const actionsRef = computed(() => unref(props.actions).filter((action) => action.visibility !== 'suppress'));
// What each button draws is read off the action's value rather than through the accessors this library's `Action`
// adds over it, so an action declared as a `@dynamicforms/vue-forms` one - which declares none of them - is drawn
// as well. The spread is that value resolved at the current breakpoint.
const actionsWithBreakpoint = computed(() =>
  actionsRef.value.map((action) => ({
    action,
    ...getRenderOptionsForBreakpoint(action.value, breakpoint.value),
  })),
);

function visibilityClasses({ action }: { action: Action }) {
  return { 'd-none': action.visibility === 'hidden', invisible: action.visibility === 'invisible' };
}

function defaultActionColor(options: ActionRenderOptions): string | undefined {
  if (options.defaultConfirm) return 'primary';
  if (options.defaultReject) return 'secondary';
  return undefined;
}
</script>

<style>
.df-actions.button-group {
  border-radius: 0.5em;
  height: fit-content;
}
/* fits the container to the small buttons; without it there is a top margin */
.df-actions.button-group:not(.df-actions--simple) {
  line-height: 0;
}
.df-actions.button-group .v-btn,
.df-actions.button-group .df-action-simple {
  border: none;
  border-radius: 0;
  margin: 0 !important;
  padding: 0 0.25em;
}
.df-actions.button-group .v-btn:first-child,
.df-actions.button-group .df-action-simple:first-child {
  border-start-start-radius: 0.5em;
  border-end-start-radius: 0.5em;
}
.df-actions.button-group .v-btn:last-child,
.df-actions.button-group .df-action-simple:last-child {
  border-start-end-radius: 0.5em;
  border-end-end-radius: 0.5em;
}
.df-actions.button-group.with-border {
  border: 0.1em solid currentColor;
}
.df-actions.button-group.with-border .v-btn:not(:first-child),
.df-actions.button-group.with-border .df-action-simple:not(:first-child) {
  border-inline-start: 0.1em solid currentColor;
}
.df-actions .v-btn:not(:first-child),
.df-actions .df-action-simple:not(:first-child) {
  margin-left: 0.5em;
}
.df-action-simple {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  padding: 0.125em 0.25em;
  border: none;
  border-radius: 0.25em;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.df-action-simple:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}
.df-action-simple:disabled {
  opacity: var(--v-disabled-opacity, 0.38);
  cursor: default;
}
.df-action-simple[aria-busy='true'] {
  cursor: progress;
}
</style>

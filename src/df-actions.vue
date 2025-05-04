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
      v-for="(action, idx) in actionsRef"
      :key="idx"
      :variant="displayAsStyle(action) === ActionDisplayStyle.BUTTON ? 'tonal' : 'text'"
      :elevation="0"
      :class="idx !== -1 ? '' : 'ms-3'"
      :size="buttonSize"
      @click.stop="(event: MouseEvent) => action.formAction.execute(event)"
    >
      <IonIcon v-if="displayIcon(action)" class="action-icon" :name="<string> action.formAction.icon"/>
      <span v-if="displayIcon(action) && displayLabel(action)" style="width: .5rem"/>
      <span v-if="displayLabel(action)">{{ labelText(action) }}</span>
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed, isRef, ref, Ref } from 'vue';
import IonIcon from 'vue-ionicon';
import { useDisplay } from 'vuetify';

import { Action, LabelRenderOptions, BreakpointNames, ActionDisplayStyle } from './helpers';

type ShowAsGroup = 'no' | 'grouped' | 'grouped-no-borders';

interface ActionComponentProps {
  actions: Action[] | Ref<Action[]>;
  buttonSize?: string | number; // see https://vuetifyjs.com/en/api/v-btn/#props-size
  showAsGroup?: ShowAsGroup
}

const props = withDefaults(defineProps<ActionComponentProps>(), {
  buttonSize: 'default',
  showAsGroup: 'no',
});

const actionsRef = <Ref<Action[]>>(isRef(props.actions) ? props.actions : ref(props.actions));

function getBreakpointName(dp: ReturnType<typeof useDisplay>): BreakpointNames {
  if (dp.xlAndUp.value) return 'xl';
  if (dp.lgAndUp.value) return 'lg';
  if (dp.mdAndUp.value) return 'md';
  if (dp.smAndUp.value) return 'sm';
  return 'xs';
}

const display = useDisplay();
const displayStyle = computed(() => {
  const res: Record<string, LabelRenderOptions> = {};
  res['%breakpoint%'] = getBreakpointName(display) as any;
  for (const action of actionsRef.value) {
    res[action.name] = action.displayStyle.getOptionsForBreakpoint(getBreakpointName(display));
  }
  return res;
});

/*
function asText(action: Action) {
  return displayStyle.value[action.name].renderAs !== ActionDisplayStyle.BUTTON;
}

function buttonVariant(action: Action) {
  return displayStyle.value[action.name].renderAs === ActionDisplayStyle.BUTTON ? 'info' : 'link';
}
*/

function displayIcon(action: Action): boolean {
  return (displayStyle.value[action.name].showIcon && action.iconAvailable) ?? true;
}

function displayLabel(action: Action): boolean {
  if (displayStyle.value[action.name].showLabel && action.labelAvailable) return true;
  return !displayIcon(action);
}

function displayAsStyle(action: Action) : ActionDisplayStyle {
  return displayStyle.value[action.name].renderAs ?? ActionDisplayStyle.BUTTON;
}

function labelText(action: Action): string {
  if (action.labelAvailable) return action.formAction.label ?? '';
  return action.name;
}
</script>

<style scoped>
.action-icon {
  width:  1.5em;
  height: 1.5em;
}
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
  margin-left: 1em;
}
</style>

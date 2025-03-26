<template>
  <input-base v-bind="props">
    <ck-editor-custom ref="$editor" v-model="value" :min-height="minHeight" :disabled="vuetifyBindings.disabled"/>
  </input-base>
</template>

<script setup lang="ts">
import { BaseEmits, BaseProps, defaultBaseProps, InputBase, useInputBase } from './helpers';
import CkEditorCustom from './helpers/ck-editor-custom.vue';

interface Props extends BaseProps {
  minHeight?: string;
}
const props = withDefaults(defineProps<Props>(), { ...defaultBaseProps, minHeight: undefined });

interface Emits extends BaseEmits {}
const emits = defineEmits<Emits>();

const { value, vuetifyBindings } = useInputBase(props, emits);
</script>

import { Editor } from '@tiptap/vue-3';
import { onBeforeUnmount, Ref, ref, watch } from 'vue';

/**
 * A counter incremented on every editor transaction and on every `update` event (`setEditable()` emits one without a
 * transaction). `Editor` is not reactive: a computed that reads this counter before `editor.isActive()`,
 * `editor.can()` or `editor.isEditable` re-evaluates on every change of the editor's state.
 */
export function useEditorTick(editorRef: Ref<Editor | undefined>) {
  const tick = ref(0);
  let bound: Editor | undefined;

  const onTick = () => {
    tick.value += 1;
  };
  const bind = (next: Editor | undefined) => {
    bound?.off('transaction', onTick);
    bound?.off('update', onTick);
    bound = next;
    bound?.on('transaction', onTick);
    bound?.on('update', onTick);
  };

  watch(editorRef, bind, { immediate: true });
  onBeforeUnmount(() => bind(undefined));

  return tick;
}

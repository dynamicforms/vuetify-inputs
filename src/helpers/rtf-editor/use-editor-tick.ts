import { Editor } from '@tiptap/vue-3';
import { onBeforeUnmount, Ref, ref, watch } from 'vue';

/**
 * A counter bumped on every editor transaction, and on every `update` (which `setEditable()` emits on its own,
 * without a transaction, to report an editable-state change). The `Editor` instance is not a reactive object, so
 * nothing else tells Vue that `editor.isActive(...)`/`editor.can()...`/`editor.isEditable` now answer differently -
 * a computed that reads this counter before calling them re-evaluates exactly when the editor's state actually
 * changed.
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

<template>
  <div class="editor-container">
    <rtf-toolbar :editor="editor" />
    <editor-content class="editor-container__editor" :editor="editor" />
    <bubble-menu v-if="editor" :editor="editor" :should-show="bubbleShouldShow">
      <div class="rtf-bubble-menu">
        <v-btn icon size="small" variant="text" :active="bubbleState.bold" @click="toggle('toggleBold')">
          <cached-icon name="mdi-format-bold" />
        </v-btn>
        <v-btn icon size="small" variant="text" :active="bubbleState.italic" @click="toggle('toggleItalic')">
          <cached-icon name="mdi-format-italic" />
        </v-btn>
        <v-btn icon size="small" variant="text" :active="bubbleState.link" @click="toggleBubbleLink">
          <cached-icon name="mdi-link-variant" />
        </v-btn>
        <v-btn icon size="small" variant="text" :active="bubbleState.bulletList" @click="toggle('toggleBulletList')">
          <cached-icon name="mdi-format-list-bulleted" />
        </v-btn>
        <v-btn icon size="small" variant="text" :active="bubbleState.orderedList" @click="toggle('toggleOrderedList')">
          <cached-icon name="mdi-format-list-numbered" />
        </v-btn>
      </div>
    </bubble-menu>
  </div>
</template>

<script setup lang="ts">
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { BubbleMenu } from '@tiptap/vue-3/menus';
import { computed, watch } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { ClassAttribute, Marker, Spoiler } from './block-styles';
import { createImagePasteHandler } from './image-paste';
import { LinkWithDownload } from './link-with-download';
import { MediaEmbed } from './media-embed';
import RtfToolbar from './rtf-toolbar.vue';
import { useEditorTick } from './use-editor-tick';
import { stripWordArtifacts } from './word-paste';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    minHeight?: string;
    disabled?: boolean;
  }>(),
  { modelValue: '', minHeight: '7em', disabled: false },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const editor = useEditor({
  content: props.modelValue,
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({ link: false }),
    LinkWithDownload.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
    Image.configure({
      inline: true,
      allowBase64: true,
      resize: {
        enabled: true,
        directions: ['top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
        minWidth: 24,
        minHeight: 24,
      },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({ placeholder: '' }),
    ClassAttribute,
    Marker,
    Spoiler,
    MediaEmbed,
  ],
  editorProps: {
    attributes: { class: 'rtf-content' },
    transformPastedHTML: (html: string) => stripWordArtifacts(html),
    handlePaste: createImagePasteHandler(() => editor.value),
  },
  onUpdate: ({ editor: instance }) => {
    emit('update:modelValue', instance.getHTML());
  },
});

// External writes (a reset, a different record loaded into the same form) are applied without re-emitting: the
// third `setContent` argument suppresses the `update` this would otherwise trigger straight back out.
watch(
  () => props.modelValue,
  (value) => {
    const instance = editor.value;
    if (!instance) return;
    const incoming = value ?? '';
    if (incoming === instance.getHTML()) return;
    instance.commands.setContent(incoming, { emitUpdate: false });
  },
);

watch(
  () => props.disabled,
  (disabled) => editor.value?.setEditable(!disabled),
);
watch(editor, (instance) => instance?.setEditable(!props.disabled));

const bubbleTick = useEditorTick(editor);
const bubbleState = computed(() => {
  void bubbleTick.value;
  return {
    bold: !!editor.value?.isActive('bold'),
    italic: !!editor.value?.isActive('italic'),
    link: !!editor.value?.isActive('link'),
    bulletList: !!editor.value?.isActive('bulletList'),
    orderedList: !!editor.value?.isActive('orderedList'),
  };
});

// A NodeSelection (an image, a table, a horizontal rule - anything selected as a whole rather than as text) is
// excluded: bold/italic/link/list toggles don't apply to a selected node, so showing this text-formatting bubble
// over one is just noise sitting on top of whatever selection UI that node has of its own (an image's resize
// handles, for instance).
function bubbleShouldShow({ state }: { state: { selection: { empty: boolean } } }) {
  return !state.selection.empty && !(state.selection instanceof NodeSelection);
}

function toggle(command: 'toggleBold' | 'toggleItalic' | 'toggleBulletList' | 'toggleOrderedList') {
  editor.value?.chain().focus()[command]().run();
}

function toggleBubbleLink() {
  const instance = editor.value;
  if (!instance) return;
  if (instance.isActive('link')) {
    instance.chain().focus().unsetLink().run();
    return;
  }

  const href = window.prompt('URL');
  if (href) instance.chain().focus().extendMarkRange('link').setLink({ href }).run();
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Oswald&family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap');

@media print {
  body {
    margin: 0 !important;
  }
}

.editor-container {
  font-family: 'Lato';
  width: 100%;
}

.rtf-content {
  font-family: 'Lato';
  line-height: 1.6;
  word-break: break-word;
  min-height: v-bind(minHeight);
  padding: 0.5em 0.75em;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  outline: none;
}

.rtf-content p {
  margin: 0 0 1em;
}

/* ProseMirror's list/table schemas wrap every block of text in a <p>, list item or cell content included, so
   without this every list item and table cell would carry the same margin ordinary paragraphs do - list items
   readable as double-spaced lines, cells with dead space above and below their text. */
.rtf-content li p,
.rtf-content td p,
.rtf-content th p {
  margin: 0;
}

.rtf-content li + li {
  margin-top: 0;
}

.rtf-content img {
  max-width: 100%;
  height: auto;
}

/* TipTap's image resize NodeView (@tiptap/extension-image's `resize` option) builds the handle elements below
   with no visual styling of their own - position only - so the consuming app is expected to supply the look. */
.rtf-content [data-resize-handle] {
  background: rgb(var(--v-theme-primary));
  border: 1px solid rgb(var(--v-theme-surface));
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.1s ease;
  z-index: 1;
}

.rtf-content [data-resize-container]:hover [data-resize-handle],
.rtf-content [data-resize-container]:focus-within [data-resize-handle] {
  opacity: 1;
}

.rtf-content [data-resize-handle='top'],
.rtf-content [data-resize-handle='bottom'] {
  height: 6px;
  cursor: ns-resize;
}

.rtf-content [data-resize-handle='left'],
.rtf-content [data-resize-handle='right'] {
  width: 6px;
  cursor: ew-resize;
}

.rtf-content [data-resize-handle='top-left'],
.rtf-content [data-resize-handle='bottom-right'] {
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
}

.rtf-content [data-resize-handle='top-right'],
.rtf-content [data-resize-handle='bottom-left'] {
  width: 10px;
  height: 10px;
  cursor: nesw-resize;
}

/* Holding Shift while dragging a handle locks the aspect ratio (ResizableNodeView's own behaviour, not
   something this component adds) - a one-off tooltip on the corner handle most people reach for first is enough
   to surface it, rather than a whole toolbar for a modifier key. */
.rtf-content [data-resize-handle='bottom-right']:hover::after {
  content: 'Hold Shift to keep the aspect ratio';
  position: absolute;
  bottom: 14px;
  right: 0;
  white-space: nowrap;
  font-size: 12px;
  font-family: 'Lato';
  padding: 2px 6px;
  border-radius: 4px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  pointer-events: none;
}

.rtf-content iframe.media-embed {
  width: 100%;
  aspect-ratio: 16 / 9;
  margin: 1em 0;
  border: 0;
}

.rtf-bubble-menu {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.rtf-content h3.category {
  font-family: 'Oswald';
  font-size: 20px;
  font-weight: bold;
  color: #555;
  letter-spacing: 10px;
  margin: 0;
  padding: 0;
}

.rtf-content h2.document-title {
  font-family: 'Oswald';
  font-size: 50px;
  font-weight: bold;
  margin: 0;
  padding: 0;
  border: 0;
}

.rtf-content h3.document-subtitle {
  font-family: 'Oswald';
  font-size: 20px;
  color: #555;
  margin: 0 0 1em;
  font-weight: bold;
  padding: 0;
}

.rtf-content p.info-box {
  --background-size: 30px;
  --background-color: #e91e63;
  padding: 1.2em 2em;
  border: 1px solid var(--background-color);
  background:
    linear-gradient(
      135deg,
      var(--background-color) 0%,
      var(--background-color) var(--background-size),
      transparent var(--background-size)
    ),
    linear-gradient(
      135deg,
      transparent calc(100% - var(--background-size)),
      var(--background-color) calc(100% - var(--background-size)),
      var(--background-color)
    );
  border-radius: 10px;
  margin: 1.5em 2em;
  box-shadow: 5px 5px 0 #ffe6ef;
}

.rtf-content blockquote.side-quote {
  font-family: 'Oswald';
  font-style: normal;
  float: right;
  width: 35%;
  position: relative;
  border: 0;
  overflow: visible;
  z-index: 1;
  margin-left: 1em;
}

.rtf-content blockquote.side-quote::before {
  content: '“';
  position: absolute;
  top: -37px;
  left: -10px;
  display: block;
  font-size: 200px;
  color: #e7e7e7;
  z-index: -1;
  line-height: 1;
}

.rtf-content blockquote.side-quote p {
  font-size: 2em;
  line-height: 1;
}

.rtf-content blockquote.side-quote p:last-child:not(:first-child) {
  font-size: 1.3em;
  text-align: right;
  color: #555;
}

.rtf-content span.marker {
  background: yellow;
}

.rtf-content span.spoiler {
  background: #000;
  color: #000;
}

.rtf-content span.spoiler:hover {
  background: #000;
  color: #fff;
}

.rtf-content pre.fancy-code {
  border: 0;
  margin-left: 2em;
  margin-right: 2em;
  border-radius: 10px;
}

.rtf-content pre.fancy-code::before {
  content: '';
  display: block;
  height: 13px;
  background: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NCAxMyI+CiAgPGNpcmNsZSBjeD0iNi41IiBjeT0iNi41IiByPSI2LjUiIGZpbGw9IiNGMzZCNUMiLz4KICA8Y2lyY2xlIGN4PSIyNi41IiBjeT0iNi41IiByPSI2LjUiIGZpbGw9IiNGOUJFNEQiLz4KICA8Y2lyY2xlIGN4PSI0Ny41IiBjeT0iNi41IiByPSI2LjUiIGZpbGw9IiM1NkM0NTMiLz4KPC9zdmc+Cg==);
  margin-bottom: 8px;
  background-repeat: no-repeat;
}

.rtf-content pre.fancy-code-dark {
  background: #272822;
  color: #fff;
  box-shadow: 5px 5px 0 #0000001f;
}

.rtf-content pre.fancy-code-bright {
  background: #dddfe0;
  color: #000;
  box-shadow: 5px 5px 0 #b3b3b3;
}
</style>

<template>
  <div class="rtf-toolbar" :class="{ 'rtf-toolbar--disabled': !editable }">
    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.Undo"
      :disabled="!editable || !state.canUndo"
      @click="editor?.chain().focus().undo().run()"
    >
      <cached-icon name="mdi-undo" />
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.Redo"
      :disabled="!editable || !state.canRedo"
      @click="editor?.chain().focus().redo().run()"
    >
      <cached-icon name="mdi-redo" />
    </v-btn>

    <v-divider vertical inset class="mx-1" />

    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.SelectAll"
      :disabled="!editable"
      @click="editor?.chain().focus().selectAll().run()"
    >
      <cached-icon name="mdi-select-all" />
    </v-btn>

    <v-divider vertical inset class="mx-1" />

    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-btn size="small" variant="text" :disabled="!editable" v-bind="menuProps" append-icon="mdi-chevron-down">
          {{ headingLabel }}
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="option in headingOptions"
          :key="option.level"
          :active="isHeadingActive(option.level)"
          @click="setHeading(option.level)"
        >
          <v-list-item-title>{{ option.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-btn size="small" variant="text" :disabled="!editable" v-bind="menuProps" append-icon="mdi-chevron-down">
          {{ t.Style }}
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="def in styleDefs"
          :key="def.key"
          :active="styleActive(def)"
          @click="editor && applyStyle(editor, def)"
        >
          <v-list-item-title>{{ t[def.key] }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-divider vertical inset class="mx-1" />

    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.Bold"
      :disabled="!editable"
      :active="state.bold"
      @click="editor?.chain().focus().toggleBold().run()"
    >
      <cached-icon name="mdi-format-bold" />
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.Italic"
      :disabled="!editable"
      :active="state.italic"
      @click="editor?.chain().focus().toggleItalic().run()"
    >
      <cached-icon name="mdi-format-italic" />
    </v-btn>

    <v-divider vertical inset class="mx-1" />

    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.HorizontalLine"
      :disabled="!editable"
      @click="editor?.chain().focus().setHorizontalRule().run()"
    >
      <cached-icon name="mdi-minus" />
    </v-btn>

    <v-menu :close-on-content-click="false" @update:model-value="(shown: boolean) => shown && openLinkMenu()">
      <template #activator="{ props: menuProps }">
        <v-btn
          icon
          size="small"
          variant="text"
          :title="t.Link"
          :disabled="!editable"
          :active="state.link"
          v-bind="menuProps"
        >
          <cached-icon name="mdi-link-variant" />
        </v-btn>
      </template>
      <v-card min-width="280" class="pa-3">
        <v-text-field
          v-model="linkUrl"
          :label="t.LinkUrl"
          density="compact"
          hide-details
          autofocus
          @keydown.enter="applyLink"
        />
        <v-checkbox v-model="linkDownloadable" :label="t.Downloadable" density="compact" hide-details class="mt-1" />
        <div class="d-flex justify-end ga-2 mt-2">
          <v-btn v-if="state.link" size="small" variant="text" @click="removeLink">{{ t.LinkRemove }}</v-btn>
          <v-btn size="small" color="primary" variant="tonal" @click="applyLink">{{ t.LinkApply }}</v-btn>
        </div>
      </v-card>
    </v-menu>

    <v-menu :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <v-btn icon size="small" variant="text" :title="t.Image" :disabled="!editable" v-bind="menuProps">
          <cached-icon name="mdi-image-plus" />
        </v-btn>
      </template>
      <v-card min-width="280" class="pa-3">
        <v-text-field
          v-model="imageUrl"
          :label="t.ImageUrl"
          density="compact"
          hide-details
          autofocus
          @keydown.enter="insertImageFromUrl"
        />
        <div class="d-flex justify-space-between align-center ga-2 mt-2">
          <v-btn size="small" variant="text" prepend-icon="mdi-upload" @click="triggerImageUpload">
            {{ t.ImageUpload }}
          </v-btn>
          <v-btn size="small" color="primary" variant="tonal" @click="insertImageFromUrl">
            {{ t.ImageInsert }}
          </v-btn>
        </div>
      </v-card>
    </v-menu>
    <input ref="imageInput" type="file" accept="image/*" class="d-none" @change="onImageFileChosen" />

    <v-menu :close-on-content-click="false">
      <template #activator="{ props: menuProps }">
        <v-btn icon size="small" variant="text" :title="t.MediaEmbed" :disabled="!editable" v-bind="menuProps">
          <cached-icon name="mdi-video-plus" />
        </v-btn>
      </template>
      <v-card min-width="280" class="pa-3">
        <v-text-field
          v-model="embedUrl"
          :label="t.MediaEmbedUrl"
          density="compact"
          hide-details
          autofocus
          @keydown.enter="insertMediaEmbed"
        />
        <div class="d-flex justify-end mt-2">
          <v-btn size="small" color="primary" variant="tonal" @click="insertMediaEmbed">
            {{ t.MediaEmbedInsert }}
          </v-btn>
        </div>
      </v-card>
    </v-menu>

    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-btn icon size="small" variant="text" :title="t.Table" :disabled="!editable" v-bind="menuProps">
          <cached-icon name="mdi-table" />
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item @click="editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()">
          <template #prepend><cached-icon name="mdi-table-plus" /></template>
          <v-list-item-title>{{ t.TableInsert }}</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item :disabled="!state.inTable" @click="editor?.chain().focus().addRowBefore().run()">
          <template #prepend><cached-icon name="mdi-table-row-plus-before" /></template>
          <v-list-item-title>{{ t.TableAddRowAbove }}</v-list-item-title>
        </v-list-item>
        <v-list-item :disabled="!state.inTable" @click="editor?.chain().focus().addRowAfter().run()">
          <template #prepend><cached-icon name="mdi-table-row-plus-after" /></template>
          <v-list-item-title>{{ t.TableAddRowBelow }}</v-list-item-title>
        </v-list-item>
        <v-list-item :disabled="!state.inTable" @click="editor?.chain().focus().deleteRow().run()">
          <template #prepend><cached-icon name="mdi-table-row-remove" /></template>
          <v-list-item-title>{{ t.TableDeleteRow }}</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item :disabled="!state.inTable" @click="editor?.chain().focus().addColumnBefore().run()">
          <template #prepend><cached-icon name="mdi-table-column-plus-before" /></template>
          <v-list-item-title>{{ t.TableAddColumnBefore }}</v-list-item-title>
        </v-list-item>
        <v-list-item :disabled="!state.inTable" @click="editor?.chain().focus().addColumnAfter().run()">
          <template #prepend><cached-icon name="mdi-table-column-plus-after" /></template>
          <v-list-item-title>{{ t.TableAddColumnAfter }}</v-list-item-title>
        </v-list-item>
        <v-list-item :disabled="!state.inTable" @click="editor?.chain().focus().deleteColumn().run()">
          <template #prepend><cached-icon name="mdi-table-column-remove" /></template>
          <v-list-item-title>{{ t.TableDeleteColumn }}</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item :disabled="!state.inTable" @click="editor?.chain().focus().toggleHeaderRow().run()">
          <template #prepend><cached-icon name="mdi-table-row" /></template>
          <v-list-item-title>{{ t.TableToggleHeaderRow }}</v-list-item-title>
        </v-list-item>
        <v-list-item :disabled="!state.inTable" @click="editor?.chain().focus().deleteTable().run()">
          <template #prepend><cached-icon name="mdi-table-remove" /></template>
          <v-list-item-title>{{ t.TableDeleteTable }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.Blockquote"
      :disabled="!editable"
      :active="state.blockquote"
      @click="editor?.chain().focus().toggleBlockquote().run()"
    >
      <cached-icon name="mdi-format-quote-close" />
    </v-btn>

    <v-divider vertical inset class="mx-1" />

    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.AlignLeft"
      :disabled="!editable"
      :active="state.alignLeft"
      @click="editor?.chain().focus().setTextAlign('left').run()"
    >
      <cached-icon name="mdi-format-align-left" />
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.AlignCenter"
      :disabled="!editable"
      :active="state.alignCenter"
      @click="editor?.chain().focus().setTextAlign('center').run()"
    >
      <cached-icon name="mdi-format-align-center" />
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.AlignRight"
      :disabled="!editable"
      :active="state.alignRight"
      @click="editor?.chain().focus().setTextAlign('right').run()"
    >
      <cached-icon name="mdi-format-align-right" />
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.AlignJustify"
      :disabled="!editable"
      :active="state.alignJustify"
      @click="editor?.chain().focus().setTextAlign('justify').run()"
    >
      <cached-icon name="mdi-format-align-justify" />
    </v-btn>

    <v-divider vertical inset class="mx-1" />

    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.BulletedList"
      :disabled="!editable"
      :active="state.bulletList"
      @click="editor?.chain().focus().toggleBulletList().run()"
    >
      <cached-icon name="mdi-format-list-bulleted" />
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.NumberedList"
      :disabled="!editable"
      :active="state.orderedList"
      @click="editor?.chain().focus().toggleOrderedList().run()"
    >
      <cached-icon name="mdi-format-list-numbered" />
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.Outdent"
      :disabled="!editable || !state.canLift"
      @click="editor?.chain().focus().liftListItem('listItem').run()"
    >
      <cached-icon name="mdi-format-indent-decrease" />
    </v-btn>
    <v-btn
      icon
      size="small"
      variant="text"
      :title="t.Indent"
      :disabled="!editable || !state.canSink"
      @click="editor?.chain().focus().sinkListItem('listItem').run()"
    >
      <cached-icon name="mdi-format-indent-increase" />
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { Editor } from '@tiptap/vue-3';
import { computed, ref } from 'vue';
import { CachedIcon } from 'vue-cached-icon';

import { translatableStrings } from '../translations';

import { applyStyle, isStyleActive, STYLE_DEFS } from './block-styles';
import { fileToDataUrl } from './image-paste';
import { toEmbedSrc } from './media-embed';
import { useEditorTick } from './use-editor-tick';

const props = defineProps<{ editor?: Editor }>();

const t = translatableStrings;

const editor = computed(() => props.editor);
const tick = useEditorTick(editor);
const editable = computed(() => !!props.editor?.isEditable);

const state = computed(() => {
  void tick.value;
  const e = props.editor;
  return {
    canUndo: !!e?.can().undo(),
    canRedo: !!e?.can().redo(),
    bold: !!e?.isActive('bold'),
    italic: !!e?.isActive('italic'),
    link: !!e?.isActive('link'),
    blockquote: !!e?.isActive('blockquote'),
    bulletList: !!e?.isActive('bulletList'),
    orderedList: !!e?.isActive('orderedList'),
    alignLeft: !!e?.isActive({ textAlign: 'left' }),
    alignCenter: !!e?.isActive({ textAlign: 'center' }),
    alignRight: !!e?.isActive({ textAlign: 'right' }),
    alignJustify: !!e?.isActive({ textAlign: 'justify' }),
    inTable: !!e?.isActive('table'),
    canLift: !!e?.can().liftListItem('listItem'),
    canSink: !!e?.can().sinkListItem('listItem'),
  };
});

const headingOptions = computed(
  () =>
    [
      { level: 0, label: t.Paragraph },
      { level: 1, label: t.Heading1 },
      { level: 2, label: t.Heading2 },
      { level: 3, label: t.Heading3 },
      { level: 4, label: t.Heading4 },
      { level: 5, label: t.Heading5 },
      { level: 6, label: t.Heading6 },
    ] as const,
);

function isHeadingActive(level: number) {
  void tick.value;
  if (level === 0) return !!editor.value?.isActive('paragraph');
  return !!editor.value?.isActive('heading', { level });
}
const headingLabel = computed(
  () => headingOptions.value.find((option) => isHeadingActive(option.level))?.label ?? t.Paragraph,
);

function setHeading(level: number) {
  const chain = editor.value?.chain().focus();
  if (!chain) return;
  if (level === 0) chain.setParagraph().run();
  else chain.toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
}

// Style dropdown
const styleDefs = STYLE_DEFS;
function styleActive(def: (typeof STYLE_DEFS)[number]) {
  void tick.value;
  return !!editor.value && isStyleActive(editor.value, def);
}

// Link menu
const linkUrl = ref('');
const linkDownloadable = ref(false);
function openLinkMenu() {
  const attrs = editor.value?.getAttributes('link') ?? {};
  linkUrl.value = attrs.href ?? '';
  linkDownloadable.value = !!attrs.download;
}
function applyLink() {
  if (!linkUrl.value) return;
  editor.value
    ?.chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: linkUrl.value })
    .updateAttributes('link', { download: linkDownloadable.value ? 'file' : null })
    .run();
}
function removeLink() {
  editor.value?.chain().focus().unsetLink().run();
}

// Image menu
const imageUrl = ref('');
const imageInput = ref<HTMLInputElement>();
function insertImageFromUrl() {
  if (!imageUrl.value) return;
  editor.value?.chain().focus().setImage({ src: imageUrl.value }).run();
  imageUrl.value = '';
}
function triggerImageUpload() {
  imageInput.value?.click();
}
async function onImageFileChosen(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const src = await fileToDataUrl(file);
  editor.value?.chain().focus().setImage({ src }).run();
  (event.target as HTMLInputElement).value = '';
}

// Media embed menu
const embedUrl = ref('');
function insertMediaEmbed() {
  if (!embedUrl.value) return;
  const src = toEmbedSrc(embedUrl.value);
  const chain = editor.value?.chain().focus();
  if (!chain) return;
  if (src) chain.insertContent({ type: 'mediaEmbed', attrs: { src } }).run();
  else {
    chain
      .insertContent({ type: 'text', text: embedUrl.value, marks: [{ type: 'link', attrs: { href: embedUrl.value } }] })
      .run();
  }
  embedUrl.value = '';
}
</script>

<style>
.rtf-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 4px;
  overflow-x: auto;
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
}

.rtf-toolbar--disabled {
  opacity: 0.6;
}
</style>

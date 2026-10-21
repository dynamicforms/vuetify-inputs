<template>
  <div class="df-hexagon-palette" :style="{ '--df-cell-ratio': cellHeightRatio }">
    <svg class="df-hexagon-palette__cells" :viewBox="viewBox" role="radiogroup" :aria-label="translate('ColorPalette')">
      <polygon
        v-for="cell in cells"
        :key="cell.index"
        :ref="(el) => setCellElement(cell.index, el)"
        class="df-hexagon-cell"
        :points="hexagonPoints(cell.x, cell.y, drawnRadius)"
        :fill="cell.color"
        role="radio"
        :aria-label="cell.color"
        :aria-checked="cell.index === selected?.index"
        :tabindex="cell.index === focusIndex ? 0 : -1"
        @click="pick(cell)"
        @keydown="onKeydown($event, cell)"
        @focus="focusIndex = cell.index"
      />
      <polygon
        v-if="selected"
        class="df-hexagon-palette__selection"
        :points="hexagonPoints(selected.x, selected.y, selectionRadius)"
        fill="none"
        :stroke="selectionStroke"
        :stroke-width="selectionWidth"
        pointer-events="none"
      />
    </svg>
    <v-slider
      v-if="!levels"
      class="df-hexagon-palette__slider"
      :style="{ '--df-lightness-gradient': lightnessGradient }"
      :model-value="lightness"
      :min="0"
      :max="1"
      :step="0.01"
      :name="translate('LightnessRange')"
      density="compact"
      hide-details
      @update:model-value="selectLightness"
    />
    <div
      v-else-if="levels.length > 1 && levels.length < segmentedFrom"
      class="df-hexagon-palette__levels"
      :style="{ '--df-level-count': levels.length }"
      role="radiogroup"
      :aria-label="translate('LightnessRange')"
    >
      <button
        v-for="(level, index) in levels"
        :key="index"
        :ref="(el) => setSegmentElement(index, el)"
        type="button"
        class="df-hexagon-palette__level"
        :class="{ 'df-hexagon-palette__level--selected': index === levelIndex }"
        :style="{ backgroundColor: greyOf(level), '--df-segment-outline': level > 0.6 ? '#000' : '#fff' }"
        role="radio"
        :aria-label="translate('Lightness', { level: index + 1 })"
        :aria-checked="index === levelIndex"
        :tabindex="index === levelIndex ? 0 : -1"
        @click="selectLevel(index)"
        @keydown="onSegmentKeydown($event, index)"
      />
    </div>
    <div
      v-else-if="levels.length >= segmentedFrom"
      class="df-hexagon-palette__segments"
      role="radiogroup"
      :aria-label="translate('LightnessRange')"
    >
      <div
        v-for="(level, index) in levels"
        :key="index"
        :ref="(el) => setSegmentElement(index, el)"
        class="df-hexagon-palette__segment"
        :class="{ 'df-hexagon-palette__segment--selected': index === levelIndex }"
        :style="{ backgroundColor: greyOf(level), '--df-segment-outline': level > 0.6 ? '#000' : '#fff' }"
        role="radio"
        :aria-label="translate('Lightness', { level: index + 1 })"
        :aria-checked="index === levelIndex"
        :tabindex="index === levelIndex ? 0 : -1"
        @click="selectLevel(index)"
        @keydown="onSegmentKeydown($event, index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import {
  type HexagonCell,
  hexagonCellRadius,
  hexagonCells,
  hexagonPoints,
  hexToOkLab,
  nearestCell,
  nearestLevel,
  okLabToHex,
} from './hexagon-palette';
import { translate } from './translations';

/**
 * The hexagon palette of `<df-color picker="hexagon">`: the cells of one lightness, and the control that selects it.
 * `levels` `null` offers any lightness from 0 to 1 with a slider; an array of more than one level offers those levels,
 * with a grid of level buttons below `segmentedFrom` levels and a segmented bar from it on. A click on a cell, or
 * Enter or Space on a focused one, writes its color.
 */
const props = defineProps<{ modelValue: string | null | undefined; rings: number; levels: number[] | null }>();
const emits = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

/** The number of levels from which the levels are a segmented bar instead of a grid of buttons. */
const segmentedFrom = 16;

// a small gap between neighbouring cells
const drawnRadius = hexagonCellRadius * 0.95;
// the outline of the selected cell lies inside the cell, so it contrasts with the cell and not with the background
const selectionWidth = drawnRadius / 6;
const selectionRadius = drawnRadius - selectionWidth;

const greyOf = (L: number) => okLabToHex({ L, a: 0, b: 0 });
const gradientStops = Array.from({ length: 11 }, (_, i) => greyOf(i / 10));
const lightnessGradient = `linear-gradient(to right, ${gradientStops.join(', ')})`;

const levelIndex = ref(0);
const lightness = ref(0.5);
// the value the palette wrote last: the lightness it was written at stays as it is
let written: string | undefined;

// the lightness follows the value: on opening, and after the value changes outside the palette
watch(
  [() => props.modelValue, () => props.levels],
  ([value]) => {
    if (value === written) return;
    const lab = hexToOkLab(value ?? '');
    if (!lab) return;
    if (props.levels) levelIndex.value = nearestLevel(props.levels, value);
    else lightness.value = Math.min(1, Math.max(0, lab.L));
  },
  { immediate: true },
);

const currentLightness = computed(() =>
  props.levels ? (props.levels[levelIndex.value] ?? props.levels[0]) : lightness.value,
);
const cells = computed(() => hexagonCells(Math.max(1, Math.floor(props.rings)), currentLightness.value));
const selected = computed(() => nearestCell(cells.value, props.modelValue));
const selectionStroke = computed(() => ((hexToOkLab(selected.value?.color ?? '')?.L ?? 0) > 0.6 ? '#000' : '#fff'));

function write(color: string) {
  written = color;
  emits('update:modelValue', color);
}

const viewBoxBounds = computed(() => {
  const margin = hexagonCellRadius + 0.05;
  const xs = cells.value.map((cell) => cell.x);
  const ys = cells.value.map((cell) => cell.y);
  const left = Math.min(...xs) - margin;
  const top = Math.min(...ys) - margin;
  return { left, top, width: Math.max(...xs) + margin - left, height: Math.max(...ys) + margin - top };
});
const viewBox = computed(() => {
  const { left, top, width, height } = viewBoxBounds.value;
  return `${left} ${top} ${width} ${height}`;
});
// the drawn height of a cell as a fraction of the palette's width, which the SVG fills: the level selector is at most
// as high as a cell
const cellHeightRatio = computed(() => (2 * drawnRadius) / viewBoxBounds.value.width);

const focusIndex = ref(0);
watch(
  selected,
  (cell) => {
    if (cell) focusIndex.value = cell.index;
  },
  { immediate: true },
);

const cellElements = new Map<number, SVGElement>();
function setCellElement(index: number, el: unknown) {
  if (el instanceof SVGElement) cellElements.set(index, el);
  else cellElements.delete(index);
}

function pick(cell: HexagonCell) {
  focusIndex.value = cell.index;
  write(cell.color);
}

// a change of the lightness writes the cell at the same place on the new lightness, where a cell is selected
function keepPlace(change: () => void) {
  const place = selected.value?.index;
  change();
  if (place !== undefined) write(cells.value[place].color);
}

function selectLevel(index: number) {
  keepPlace(() => {
    levelIndex.value = index;
  });
}

function selectLightness(value: number) {
  keepPlace(() => {
    lightness.value = value;
  });
}

// the level buttons or the segments, whichever are rendered
const segmentElements = new Map<number, HTMLElement>();
function setSegmentElement(index: number, el: unknown) {
  if (el instanceof HTMLElement) segmentElements.set(index, el);
  else segmentElements.delete(index);
}

// the arrow keys, Home and End select a neighbouring, the first or the last level and move the focus to it
function onSegmentKeydown(event: KeyboardEvent, index: number) {
  const last = (props.levels?.length ?? 1) - 1;
  const target = {
    ArrowLeft: index - 1,
    ArrowDown: index - 1,
    ArrowRight: index + 1,
    ArrowUp: index + 1,
    Home: 0,
    End: last,
  }[event.key];
  if (target === undefined) return;
  event.preventDefault();
  const next = Math.min(last, Math.max(0, target));
  selectLevel(next);
  segmentElements.get(next)?.focus();
}

// the neighbour of `cell` in the direction of an arrow key
function neighbour(cell: HexagonCell, key: string): HexagonCell | undefined {
  const candidates = cells.value.filter((other) => {
    const dx = other.x - cell.x;
    const dy = other.y - cell.y;
    if (Math.hypot(dx, dy) > 1.01 || other === cell) return false;
    if (key === 'ArrowLeft') return Math.abs(dy) < 0.01 && dx < 0;
    if (key === 'ArrowRight') return Math.abs(dy) < 0.01 && dx > 0;
    if (key === 'ArrowUp') return dy < -0.01;
    return dy > 0.01;
  });
  return candidates.sort((one, other) => one.x - other.x)[0];
}

function onKeydown(event: KeyboardEvent, cell: HexagonCell) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    pick(cell);
  } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const next = neighbour(cell, event.key);
    if (next) {
      focusIndex.value = next.index;
      cellElements.get(next.index)?.focus();
    }
  }
}
</script>

<style>
.df-hexagon-palette {
  container-type: inline-size;
  --df-cell-height: calc(var(--df-cell-ratio) * 100cqi);
  width: 18.75rem;
  padding: 0.75rem 0.75rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.df-hexagon-palette__cells {
  width: 100%;
  height: auto;
  display: block;
}

.df-hexagon-cell {
  cursor: pointer;
  outline: none;
}

.df-hexagon-cell:focus-visible {
  stroke: currentColor;
  stroke-width: 0.06;
}

.df-hexagon-palette__slider {
  width: 100%;
  flex: none;
}

.df-hexagon-palette__slider .v-slider-track__background {
  background: var(--df-lightness-gradient) !important;
  opacity: 1 !important;
  height: 0.5rem !important;
}

.df-hexagon-palette__slider .v-slider-track__fill {
  display: none;
}

.df-hexagon-palette__segments {
  display: flex;
  width: 100%;
  height: min(1.5rem, var(--df-cell-height));
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 0.25rem;
  overflow: hidden;
}

.df-hexagon-palette__segment {
  flex: 1 1 0;
  cursor: pointer;
  outline: none;
}

.df-hexagon-palette__segment--selected,
.df-hexagon-palette__segment:focus-visible {
  box-shadow: inset 0 0 0 2px var(--df-segment-outline);
}

.df-hexagon-palette__levels {
  display: grid;
  grid-template-columns: repeat(var(--df-level-count), 1fr);
  gap: 0.1em;
  width: 100%;
}

.df-hexagon-palette__level {
  width: min(100%, var(--df-cell-height));
  min-width: 0;
  aspect-ratio: 1;
  justify-self: center;
  align-self: center;
  padding: 0;
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 0.25rem;
  cursor: pointer;
  outline: none;
}

.df-hexagon-palette__level--selected {
  border-color: currentColor;
  box-shadow: inset 0 0 0 2px var(--df-segment-outline);
}

.df-hexagon-palette__level:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}
</style>

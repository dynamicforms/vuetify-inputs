<template>
  <div class="df-hexagon-palette">
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
        :points="hexagonPoints(selected.x, selected.y, drawnRadius)"
        fill="none"
        :stroke="selectionStroke"
        :stroke-width="drawnRadius / 5"
        pointer-events="none"
      />
    </svg>
    <v-btn-toggle
      v-if="levels.length > 1"
      class="df-hexagon-palette__levels"
      :model-value="levelIndex"
      mandatory
      density="compact"
      variant="outlined"
      divided
      @update:model-value="selectLevel"
    >
      <v-btn
        v-for="(level, index) in levels"
        :key="index"
        :value="index"
        :aria-label="translate('Lightness', { level: index + 1 })"
      >
        <span
          class="df-hexagon-palette__level-swatch"
          :style="{ backgroundColor: okLabToHex({ L: level, a: 0, b: 0 }) }"
        />
      </v-btn>
    </v-btn-toggle>
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
 * The hexagon palette of `<df-color picker="hexagon">`: the cells of one lightness level of `levels`, and a selector
 * of the level where there is more than one. A click on a cell, or Enter or Space on a focused one, writes its color.
 */
const props = defineProps<{ modelValue: string | null | undefined; rings: number; levels: number[] }>();
const emits = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

// a small gap between neighbouring cells
const drawnRadius = hexagonCellRadius * 0.95;

const levelIndex = ref(0);
// the level follows the value: on opening, and after a cell of another level is written
watch(
  () => props.modelValue,
  (value) => {
    if (hexToOkLab(value ?? '')) levelIndex.value = nearestLevel(props.levels, value);
  },
  { immediate: true },
);

const cells = computed(() => hexagonCells(Math.max(1, Math.floor(props.rings)), props.levels[levelIndex.value] ?? 0.6));
const selected = computed(() => nearestCell(cells.value, props.modelValue));
const selectionStroke = computed(() => ((hexToOkLab(selected.value?.color ?? '')?.L ?? 0) > 0.6 ? '#000' : '#fff'));

const viewBox = computed(() => {
  const margin = hexagonCellRadius + 0.05;
  const xs = cells.value.map((cell) => cell.x);
  const ys = cells.value.map((cell) => cell.y);
  const left = Math.min(...xs) - margin;
  const top = Math.min(...ys) - margin;
  return `${left} ${top} ${Math.max(...xs) + margin - left} ${Math.max(...ys) + margin - top}`;
});

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
  emits('update:modelValue', cell.color);
}

// switching the level writes the cell at the same place on the new level, where a cell is selected
function selectLevel(index: number) {
  const place = selected.value?.index;
  levelIndex.value = index;
  if (place !== undefined) emits('update:modelValue', cells.value[place].color);
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

.df-hexagon-palette__level-swatch {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(128, 128, 128, 0.5);
}
</style>

<template>
  <div class="space-y-4">
    <div
      v-for="seg in segments"
      :key="seg.id"
      class="p-4 rounded-lg border transition-all"
      :class="[
        seg.containsPii
          ? 'border-red-200 bg-red-50'
          : getSpeakerColor(seg.speakerId),
      ]"
    >
      <div class="flex justify-between mb-2">
        <span class="text-xs font-bold uppercase text-gray-400">
          Спикер {{ seg.speakerId }} • {{ seg.startTime.toFixed(1) }}с
        </span>
        <div v-if="seg.containsPii" class="flex gap-1">
          <span
            v-for="type in seg.piiTypes"
            :key="type"
            class="text-[10px] bg-red-200 text-red-700 px-2 py-0.5 rounded-full"
          >
            {{ type }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-gray-400 mb-1">Оригинал</p>
          <p class="text-sm italic text-gray-600">{{ seg.originalText }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 mb-1">Результат (Redacted)</p>
          <p class="text-sm font-medium">{{ seg.redactedText }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TranscriptSegmentDto } from "@/api/types";
defineProps<{ segments: TranscriptSegmentDto[] }>();

const speakerColors = [
  "border-sky-200 bg-sky-50",
  "border-emerald-200 bg-emerald-50",
  "border-amber-200 bg-amber-50",
  "border-violet-200 bg-violet-50",
  "border-rose-200 bg-rose-50",
];

const getSpeakerColor = (speakerId: number) => {
  return speakerColors[speakerId % speakerColors.length];
};
</script>

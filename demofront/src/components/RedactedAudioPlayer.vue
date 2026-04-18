<template>
  <div class="bg-gray-900 rounded-2xl p-6 text-white">
    <!-- Таймлайн с отметками PII -->
    <div class="relative h-4 bg-gray-700 rounded-full mb-4 overflow-hidden">
      <!-- Индикаторы PII -->
      <div
        v-for="seg in segments.filter((s) => s.containsPii)"
        :key="seg.id"
        class="absolute h-full bg-red-500 opacity-60"
        :style="{
          left: (seg.startTime / duration) * 100 + '%',
          width: ((seg.endTime - seg.startTime) / duration) * 100 + '%',
        }"
        v-tooltip="seg.piiTypes.join(', ')"
      ></div>

      <!-- Прогресс воспроизведения -->
      <div
        class="absolute h-full bg-blue-500 transition-all duration-100"
        :style="{ width: (currentTime / duration) * 100 + '%' }"
      ></div>
    </div>

    <div class="flex items-center gap-4">
      <button
        @click="togglePlay"
        class="bg-white text-black p-3 rounded-full hover:bg-blue-400"
      >
        <PlayIcon v-if="!isPlaying" />
        <PauseIcon v-else />
      </button>

      <div class="flex-1">
        <div class="text-sm font-medium">Анонимизированная запись</div>
        <div class="text-xs text-gray-400">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </div>
      </div>

      <audio
        ref="audioRef"
        :src="audioUrl"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoaded"
        @ended="isPlaying = false"
      ></audio>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { PlayIcon, PauseIcon } from "lucide-vue-next";
import type { TranscriptSegmentDto } from "@/api/types";

const props = defineProps<{
  audioUrl: string;
  segments: TranscriptSegmentDto[];
  duration: number;
}>();

const audioRef = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);

const togglePlay = () => {
  if (isPlaying.value) audioRef.value?.pause();
  else audioRef.value?.play();
  isPlaying.value = !isPlaying.value;
};

const onTimeUpdate = () => {
  currentTime.value = audioRef.value?.currentTime || 0;
};

const formatTime = (s: number) => {
  const min = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};
</script>

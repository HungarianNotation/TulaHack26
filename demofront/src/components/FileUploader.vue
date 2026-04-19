<template>
  <div
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    :class="[
      'border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer',
      isDragging
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-300 hover:border-blue-400',
    ]"
    @click="$refs.fileInput.click()"
  >
    <input
      type="file"
      ref="fileInput"
      class="hidden"
      @change="handleFileSelect"
      accept="audio/*"
    />
    <div class="flex flex-col items-center">
      <div
        class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      </div>
      <h3 class="text-lg font-bold">Нажмите для загрузки записи</h3>
      <p class="text-gray-500 text-sm">
        или перетащите аудиофайл сюда (WAV, M4A, MP3)
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { callService } from "@/api/call-services";

const emit = defineEmits(["uploaded"]);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) upload(file);
};

const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) upload(file);
};

const upload = async (file: File) => {
  try {
    const res = await callService.uploadAudio(file);
    emit("uploaded", res.callRecordId);
  } catch (e) {
    alert("Ошибка при загрузке файла");
  }
};
</script>

<template>
  <div v-if="call" class="max-w-4xl mx-auto space-y-8">
    <!-- Шапка страницы -->
    <div class="flex justify-between items-center">
      <router-link
        to="/"
        class="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition"
      >
        <ArrowLeftIcon class="w-4 h-4" /> Назад к дашборду
      </router-link>

      <div
        v-if="call.callRecord.status !== 'COMPLETED'"
        class="flex items-center gap-2 text-blue-600 font-bold italic"
      >
        <Loader2Icon class="w-4 h-4 animate-spin" />
        Идет обработка системой...
      </div>
    </div>

    <!-- Основной контент (когда готово) -->
    <div
      v-if="call.callRecord.status === 'COMPLETED'"
      class="space-y-8 animate-in fade-in duration-500"
    >
      <!-- Используем наш компонент плеера -->
      <RedactedAudioPlayer
        :audio-url="audioUrl"
        :segments="call.segments"
        :duration="call.callRecord.durationSeconds"
      />

      <div class="space-y-4">
        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquareIcon class="w-5 h-5 text-blue-500" />
          Результаты расшифровки
        </h2>

        <!-- Используем наш компонент списка транскрипта -->
        <TranscriptList :segments="call.segments" />
      </div>
    </div>

    <!-- Состояние ошибки -->
    <div
      v-else-if="call.callRecord.status === 'ERROR'"
      class="text-center py-20 bg-red-50 rounded-3xl border border-red-100"
    >
      <AlertCircleIcon class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 class="text-lg font-bold text-red-700">Ошибка обработки</h3>
      <p class="text-red-500 text-sm">Файл поврежден или не содержит речи.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { callService } from "@/api/call-services";
import type { CallDetailsDto } from "@/api/types";

// Импортируем компоненты
import RedactedAudioPlayer from "@/components/RedactedAudioPlayer.vue";
import TranscriptList from "@/components/TranscriptList.vue";

// Импортируем иконки
import {
  ArrowLeftIcon,
  Loader2Icon,
  MessageSquareIcon,
  AlertCircleIcon,
} from "lucide-vue-next";

const route = useRoute();
const call = ref<CallDetailsDto | null>(null);
const audioUrl = ref("");
let timer: any = null;

const fetchDetails = async () => {
  try {
    const data = await callService.getCallDetails(Number(route.params.id));
    call.value = data;

    if (data.callRecord.status === "COMPLETED") {
      clearInterval(timer);
      const audioBlob = await callService.getRedactedAudio(data.callRecord.id);
      audioUrl.value = URL.createObjectURL(audioBlob);
    }
  } catch (e) {
    console.error("Ошибка загрузки деталей:", e);
  }
};

onMounted(() => {
  fetchDetails();
  timer = setInterval(fetchDetails, 3000);
});

onUnmounted(() => {
  clearInterval(timer);
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value); // Освобождаем память
});
</script>

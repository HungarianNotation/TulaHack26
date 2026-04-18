<template>
  <div class="space-y-8">
    <!-- Статистика -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 uppercase font-bold tracking-wider">
          Всего обработано
        </p>
        <p class="text-3xl font-black text-blue-600">
          {{ stats.totalCallsProcessed }}
        </p>
      </div>
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 uppercase font-bold tracking-wider">
          Утечек предотвращено
        </p>
        <p class="text-3xl font-black text-red-500">
          {{ stats.totalPiiIncidentsFound }}
        </p>
      </div>
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 uppercase font-bold tracking-wider">
          Типы данных
        </p>
        <p class="text-sm text-gray-600 mt-1">
          {{ Object.keys(stats.piiTypeDistribution).join(", ") || "Нет" }}
        </p>
      </div>
    </div>

    <!-- Загрузка -->
    <FileUploader @uploaded="onUploaded" />

    <!-- Список -->
    <div
      class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
    >
      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
              Дата
            </th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
              Статус
            </th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
              Длительность
            </th>
            <th class="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="call in calls"
            :key="call.id"
            class="hover:bg-gray-50 transition"
          >
            <td class="px-6 py-4 text-sm font-medium">
              {{ formatDate(call.createdAt) }}
            </td>
            <td class="px-6 py-4 text-sm">
              <span
                :class="statusStyle(call.status)"
                class="px-2 py-1 rounded text-xs font-bold uppercase"
              >
                {{ call.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {{ call.durationSeconds || 0 }} сек
            </td>
            <td class="px-6 py-4 text-right text-sm">
              <router-link
                :to="'/call/' + call.id"
                class="text-blue-600 hover:underline font-bold"
              >
                Результаты →
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { callService } from "@/api/call-services";
import FileUploader from "@/components/FileUploader.vue";
import type { CallRecordDto, StatsResponse } from "@/api/types";

const calls = ref<CallRecordDto[]>([]);
const stats = ref<StatsResponse | null>(null);

const onUploaded = (id: number) => {
  fetchData();
};

const fetchData = async () => {
  calls.value = await callService.getMyCalls();
  stats.value = await callService.getStats();
};

const formatDate = (date: string) => new Date(date).toLocaleString("ru-RU");

const statusStyle = (status: string) => {
  const map: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    TRANSCRIBING: "bg-blue-100 text-blue-700 animate-pulse",
    ERROR: "bg-red-100 text-red-700",
  };
  return map[status] || "bg-gray-100 text-gray-700";
};

onMounted(fetchData);
</script>

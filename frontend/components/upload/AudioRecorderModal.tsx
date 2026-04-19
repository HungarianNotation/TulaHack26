"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  StopCircle,
  Upload,
  X,
  Play,
  Pause,
  Loader2,
  Edit2,
} from "lucide-react";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import { callService } from "@/services/call-services";

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Утилита для настоящей конвертации WebM/MP4 (от браузера) в чистый PCM WAV для Python
async function convertBlobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  // Поддержка Safari
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();

  // Декодируем браузерный формат в сырые аудиоданные (PCM)
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  let offset = 0;

  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };

  // Записываем правильные WAV (RIFF) заголовки
  writeString("RIFF");
  view.setUint32(offset, 36 + audioBuffer.length * numOfChan * 2, true);
  offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true);
  offset += 4; // Subchunk1Size (16 for PCM)
  view.setUint16(offset, 1, true);
  offset += 2; // AudioFormat (1 for PCM)
  view.setUint16(offset, numOfChan, true);
  offset += 2; // NumChannels
  view.setUint32(offset, audioBuffer.sampleRate, true);
  offset += 4; // SampleRate
  view.setUint32(offset, audioBuffer.sampleRate * 2 * numOfChan, true);
  offset += 4; // ByteRate
  view.setUint16(offset, numOfChan * 2, true);
  offset += 2; // BlockAlign
  view.setUint16(offset, 16, true);
  offset += 2; // BitsPerSample

  writeString("data");
  view.setUint32(offset, audioBuffer.length * numOfChan * 2, true);
  offset += 4;

  // Смешиваем каналы (interleave)
  const channels = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let sample;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      sample = channels[channel][i];
      sample = Math.max(-1, Math.min(1, sample)); // Ограничиваем от -1 до 1
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // Переводим в 16-bit
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Берем оригинальный формат браузера (webm или mp4)
        const rawBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        try {
          // Конвертируем в настоящий PCM WAV
          const wavBlob = await convertBlobToWav(rawBlob);
          const url = URL.createObjectURL(wavBlob);
          setAudioBlob(wavBlob);
          setAudioUrl(url);
        } catch (err) {
          console.error("Ошибка при конвертации аудио:", err);
          setError("Не удалось обработать аудио. Попробуйте еще раз.");
        } finally {
          stream.getTracks().forEach((track) => track.stop());
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      setError("Не удалось получить доступ к микрофону. Проверьте разрешения.");
    }
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}

export default function AudioRecorderModal({
  isOpen,
  onClose,
  onSuccess,
}: AudioRecorderModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    isRecording,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
      resetRecording();
      setFileName("");
      setUploadError(null);
    } else if (!isOpen && dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
  }, [isOpen, resetRecording]);

  const handleClose = () => {
    resetRecording();
    setFileName("");
    setUploadError(null);
    onClose();
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const finalFileName = fileName.trim()
        ? `${fileName.trim()}.wav`
        : `recording_${Date.now()}.wav`;
      const file = new File([audioBlob], finalFileName, { type: "audio/wav" });
      await callService.uploadAudioFile(file);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("Ошибка при загрузке. Попробуйте ещё раз.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-middle"
      onClose={handleClose}
    >
      <div className="modal-box bg-custom-bg-main p-0 overflow-hidden max-w-md w-full shadow-xl">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-custom-secondary/20">
          <h3 className="text-xl font-bold text-custom-main">Запись аудио</h3>
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-circle btn-secondary btn-sm cursor-pointer"
            disabled={isUploading}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 text-red-500 text-sm text-center py-2 rounded-full mb-4">
              {error}
            </div>
          )}

          {!audioBlob ? (
            // Режим записи
            <div className="text-center space-y-6">
              <div className="bg-custom-bg-main/30 rounded-card p-8">
                <Mic className="w-12 h-12 text-custom-accent mx-auto mb-4" />
                <p className="text-custom-main mb-2">
                  {isRecording ? "Идёт запись..." : "Нажмите для начала записи"}
                </p>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="btn btn-primary gap-2 cursor-pointer"
                  >
                    <Mic size={18} />
                    Начать запись
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="btn btn-error gap-2 cursor-pointer"
                  >
                    <StopCircle size={18} />
                    Остановить запись
                  </button>
                )}
              </div>
              <p className="text-xs text-custom-placeholder">
                Разрешите доступ к микрофону, чтобы записать аудио.
              </p>
            </div>
          ) : (
            // Режим предпросмотра
            <div className="space-y-6">
              <div className="bg-custom-bg-main/30 rounded-card p-4">
                <div className="mb-3">
                  <WaveformPlayer
                    backgroundColor="transparent"
                    height={90}
                    waveHeight={50}
                    width="100%"
                    src={audioUrl || ""}
                    progressColor="#775ee1"
                    waveColor="darkgray"
                    buttonColor="var(--color-custom-accent)"
                    volumeSliderFillColor="#775ee1"
                    volumeSliderTrackColor="darkgray"
                    neon={true}
                    showTime={true}
                    neonIntensity={2}
                  />
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => resetRecording()}
                    className="btn btn-secondary gap-2 cursor-pointer"
                  >
                    Записать заново
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-custom-secondary flex items-center gap-2">
                  <Edit2 size={14} />
                  Название файла (без расширения)
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="моя_запись"
                  className="w-full px-4 py-2 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder"
                />
                <p className="text-xs text-custom-placeholder">
                  .wav добавится автоматически
                </p>
              </div>

              {uploadError && (
                <div className="bg-red-500/10 text-red-500 text-sm text-center py-2 rounded-full">
                  {uploadError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Футер с кнопками (только в режиме предпросмотра) */}
        {audioBlob && (
          <div className="flex gap-3 p-6 pt-4 border-t border-custom-secondary/20">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary flex-1 cursor-pointer"
              disabled={isUploading}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="btn btn-primary flex-1 gap-2 cursor-pointer"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? "Загрузка..." : "Отправить на обработку"}
            </button>
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={handleClose}>
          close
        </button>
      </form>
    </dialog>
  );
}

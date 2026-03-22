import { useState, useRef, useCallback } from 'react';
import { autoCorrelate, noteFromPitch, getNoteString } from '@/lib/audio-utils';

export interface PitchDataPoint {
  time: number;
  frequency: number;
  note: string;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [currentPitch, setCurrentPitch] = useState<{ freq: number; note: string; cents: number } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pitchHistoryRef = useRef<PitchDataPoint[]>([]);

  // We expose a ref to an external canvas to draw the waveform
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false } });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      pitchHistoryRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
      };

      startTimeRef.current = audioCtx.currentTime;
      mediaRecorder.start(100);
      setIsRecording(true);
      setAudioBlob(null);

      updateVisualization();
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      
      setCurrentPitch(null);
    }
  }, [isRecording]);

  const updateVisualization = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const analyser = analyserRef.current;
    
    // Waveform drawing
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (canvasCtx) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgba(15, 23, 42, 1)'; // Match bg
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'hsl(258, 90%, 66%)'; // Primary color
        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * canvas.height / 2;

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      }
    }

    // Pitch detection
    const floatDataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(floatDataArray);
    const pitch = autoCorrelate(floatDataArray, audioContextRef.current.sampleRate);
    
    if (pitch !== -1 && pitch > 50 && pitch < 2000) { // Reasonable human vocal range
      const noteNum = noteFromPitch(pitch);
      const noteStr = getNoteString(noteNum);
      setCurrentPitch({
        freq: pitch,
        note: noteStr,
        cents: 0 // Simplification for now
      });
      
      pitchHistoryRef.current.push({
        time: audioContextRef.current.currentTime - startTimeRef.current,
        frequency: pitch,
        note: noteStr
      });
    } else {
      setCurrentPitch(null);
    }

    animationFrameRef.current = requestAnimationFrame(updateVisualization);
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    currentPitch,
    canvasRef,
    pitchHistory: pitchHistoryRef.current,
  };
}

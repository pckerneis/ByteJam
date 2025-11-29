export enum ModeOption {
  Int = "int",
  Float = "float",
}

export enum SampleRateOption {
  _8k = "8kHz",
  _16k = "16kHz",
  _44_1k = "44.1kHz"
}

export function getSampleRateValue(sampleRate: SampleRateOption): number {
  switch (sampleRate) {
    case SampleRateOption._8k: return 8000;
    case SampleRateOption._16k: return 16000;
    case SampleRateOption._44_1k: return 44100;
  }
}


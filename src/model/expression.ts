export enum ModeOption {
  Int = 'int',
  Float = 'float',
}

export enum SampleRateOption {
  _8k = '8kHz',
  _16k = '16kHz',
  _44_1k = '44.1kHz',
}

export type EncodedMode = 'int' | 'float';
export type EncodedSampleRate = '8k' | '16k' | '44.1k';

export function getSampleRateValue(sampleRate: SampleRateOption): number {
  switch (sampleRate) {
    case SampleRateOption._8k:
      return 8000;
    case SampleRateOption._16k:
      return 16000;
    case SampleRateOption._44_1k:
      return 44100;
  }
}

export function encodeMode(mode: ModeOption): EncodedMode {
  // ModeOption values already match the encoded strings.
  return mode;
}

export function decodeMode(value: EncodedMode | null | undefined): ModeOption {
  if (value === 'int') return ModeOption.Int;
  return ModeOption.Float;
}

export function encodeSampleRate(sampleRate: SampleRateOption): EncodedSampleRate {
  switch (sampleRate) {
    case SampleRateOption._8k:
      return '8k';
    case SampleRateOption._16k:
      return '16k';
    case SampleRateOption._44_1k:
    default:
      return '44.1k';
  }
}

export function decodeSampleRate(value: EncodedSampleRate | null | undefined): SampleRateOption {
  switch (value) {
    case '8k':
      return SampleRateOption._8k;
    case '16k':
      return SampleRateOption._16k;
    case '44.1k':
    default:
      return SampleRateOption._44_1k;
  }
}

export function minimizeExpression(expr: string): string {
  try {
    // Remove spaces around common operators and punctuation, then collapse leftovers.
    const tightened = expr.replace(/\s*([+\-*/%&|^!<>=?:,;(){}\[\]])\s*/g, '$1');
    return tightened.replace(/\s+/g, ' ').trim();
  } catch {
    return expr;
  }
}

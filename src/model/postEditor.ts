import { ModeOption, SampleRateOption } from './expression';

export interface PostMetadataModel {
  title: string;
  mode: ModeOption;
  sampleRate: SampleRateOption;
  isDraft: boolean;
}

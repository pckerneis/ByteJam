import { ModeOption } from './expression';

export interface PostMetadataModel {
  title: string;
  mode: ModeOption;
  sampleRate: number;
  isDraft: boolean;
}

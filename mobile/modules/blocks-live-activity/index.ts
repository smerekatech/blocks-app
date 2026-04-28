import { requireOptionalNativeModule } from 'expo-modules-core';

export interface StartArgs {
  /** ms since epoch */
  startedAtMs: number;
  /** ms since epoch */
  endsAtMs: number;
  activityName: string;
  /** Hex color string, e.g. "#22c55e" */
  colorHex: string;
  half: 1 | 2;
}

export interface UpdateArgs {
  startedAtMs: number;
  endsAtMs: number;
  half: 1 | 2;
}

interface NativeModule {
  start(args: StartArgs): Promise<void>;
  update(args: UpdateArgs): Promise<void>;
  end(): Promise<void>;
}

const Native = requireOptionalNativeModule<NativeModule>('BlocksLiveActivity');

export const BlocksLiveActivity = Native;

export default Native;

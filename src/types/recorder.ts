// meta
import type { RecorderStatesEnum } from "@/meta/recorder.meta";

export type RecorderState = (typeof RecorderStatesEnum)[keyof typeof RecorderStatesEnum];
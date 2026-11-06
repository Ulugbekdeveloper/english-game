import React from 'react';
import { SvgXml } from 'react-native-svg';
import { flagSvg } from '@eg/shared';
import type { FlagSpec } from '@eg/shared';

export function Flag({ spec, width = 24, height = 31 }: { spec: FlagSpec | null; width?: number; height?: number }) {
  const s = spec ?? { bg: { kind: 'solid' as const, c1: 5 } };
  return <SvgXml xml={flagSvg(s, 100, 130)} width={width} height={height} />;
}

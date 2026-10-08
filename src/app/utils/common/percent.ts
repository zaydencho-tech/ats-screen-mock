/**
 * Largest remainder method — 정수 % 배분 (합계 = totalPercent).
 * 파이 차트 범례 등에서 각 항목을 독립 반올림하면 합이 100%가 어긋날 수 있어 사용.
 */
export function distributeIntegerPercents(
  values: number[],
  totalPercent = 100,
): number[] {
  if (values.length === 0) return [];

  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return values.map(() => 0);
  }

  const exactPercents = values.map(
    (value) => (value / total) * totalPercent,
  );
  const floors = exactPercents.map((percent) => Math.floor(percent));
  let remainder =
    totalPercent - floors.reduce((sum, percent) => sum + percent, 0);

  const remainderOrder = exactPercents
    .map((percent, index) => ({
      index,
      fraction: percent - Math.floor(percent),
    }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
    .map((item) => item.index);

  const result = [...floors];
  for (let i = 0; i < remainder; i += 1) {
    result[remainderOrder[i]] += 1;
  }

  return result;
}

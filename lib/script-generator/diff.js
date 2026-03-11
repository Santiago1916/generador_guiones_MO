function tokenize(text = "") {
  return String(text)
    .split(/(\s+)/)
    .filter((token) => token.length > 0);
}

export function buildScriptDiff(originalText = "", nextText = "") {
  const originalTokens = tokenize(originalText);
  const nextTokens = tokenize(nextText);
  const rows = Array.from({ length: originalTokens.length + 1 }, () =>
    Array(nextTokens.length + 1).fill(0)
  );

  for (let left = originalTokens.length - 1; left >= 0; left -= 1) {
    for (let right = nextTokens.length - 1; right >= 0; right -= 1) {
      rows[left][right] =
        originalTokens[left] === nextTokens[right]
          ? rows[left + 1][right + 1] + 1
          : Math.max(rows[left + 1][right], rows[left][right + 1]);
    }
  }

  const additions = [];
  const removals = [];
  const updatedSegments = [];
  let left = 0;
  let right = 0;

  while (left < originalTokens.length && right < nextTokens.length) {
    if (originalTokens[left] === nextTokens[right]) {
      updatedSegments.push({ type: "same", text: nextTokens[right] });
      left += 1;
      right += 1;
      continue;
    }

    if (rows[left + 1][right] >= rows[left][right + 1]) {
      removals.push(originalTokens[left]);
      left += 1;
      continue;
    }

    additions.push(nextTokens[right]);
    updatedSegments.push({ type: "added", text: nextTokens[right] });
    right += 1;
  }

  while (left < originalTokens.length) {
    removals.push(originalTokens[left]);
    left += 1;
  }

  while (right < nextTokens.length) {
    additions.push(nextTokens[right]);
    updatedSegments.push({ type: "added", text: nextTokens[right] });
    right += 1;
  }

  return {
    hasChanges: additions.length > 0 || removals.length > 0,
    addedText: additions.join(""),
    removedText: removals.join(""),
    updatedSegments,
  };
}

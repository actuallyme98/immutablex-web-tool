export const mixArrays = <T>(array1: T[], array2: T[]) => {
  const mixedArray = [];
  const maxLength = Math.max(array1.length, array2.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < array1.length) {
      mixedArray.push(array1[i]);
    }
    if (i < array2.length) {
      mixedArray.push(array2[i]);
    }
  }

  return mixedArray;
};

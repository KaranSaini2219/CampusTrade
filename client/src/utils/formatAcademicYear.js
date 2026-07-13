export const formatAcademicYear = (year) => {
  const numericYear = Number(year);

  if (!Number.isInteger(numericYear) || numericYear < 1) {
    return year || 'N/A';
  }

  const lastTwoDigits = numericYear % 100;
  const suffix =
    lastTwoDigits >= 11 && lastTwoDigits <= 13
      ? 'th'
      : { 1: 'st', 2: 'nd', 3: 'rd' }[numericYear % 10] || 'th';

  return `${numericYear}${suffix} Year`;
};

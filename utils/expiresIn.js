const expiresIn = (duration) => {
  let durationDigit;
  if (isNaN(duration * 1)) {
    durationDigit = duration.slice(0, -1) * 1;
  }

  if (duration.endsWith('h')) {
    return Date.now() / 1000 + durationDigit * 60 ** 2;
  }

  if (duration.endsWith('m')) {
    return Date.now() / 1000 + durationDigit * 60;
  }
  if (duration.endsWith('d')) {
    return Date.now() / 1000 + durationDigit * 24 * 60 ** 2;
  }
};

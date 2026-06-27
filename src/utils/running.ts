export function speedToPaceSecondsPerKilometer(
  metersPerSecond: number,
): number {
  if (metersPerSecond <= 0) {
    return 0;
  }

  return 1000 / metersPerSecond;
}

export function speedToPaceMinutesPerKilometer(
  metersPerSecond: number,
): string {
  const secondsPerKilometer = Math.round(
    speedToPaceSecondsPerKilometer(metersPerSecond),
  );
  if (secondsPerKilometer === 0) {
    return "0:00";
  }

  const minutes = Math.floor(secondsPerKilometer / 60);
  const seconds = secondsPerKilometer % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

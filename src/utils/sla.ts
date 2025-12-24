export async function convertSlaTimeToWorkingHours(
  slaTimeHours: number
): Promise<{ breachDateISO: string; breachTimestamp: number }> {
  const workingHoursPerDay = 8;
  const workingDaysPerWeek = 5;
  const workingStartHour = 8; // 8 AM
  const workingEndHour = 17; // 5 PM

  const now = new Date();
  let breachDate = new Date(now.getTime());
  let remainingHours = slaTimeHours;
  console.log("-------------------- Converting SLA time:", slaTimeHours, "hours--------------------");

  while (remainingHours > 0) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (breachDate.getDay() === 0 || breachDate.getDay() === 6) {
      breachDate.setDate(breachDate.getDate() + 1);
      breachDate.setHours(workingStartHour, 0, 0, 0);
      continue;
    }

    // If it's before working hours, move to start of working day
    if (breachDate.getHours() < workingStartHour) {
      breachDate.setHours(workingStartHour, 0, 0, 0);
    }

    // If it's after working hours, move to next working day
    if (breachDate.getHours() >= workingEndHour) {
      breachDate.setDate(breachDate.getDate() + 1);
      breachDate.setHours(workingStartHour, 0, 0, 0);
      continue;
    }

    // Calculate remaining working hours in current day
    const hoursLeftInDay = workingEndHour - breachDate.getHours();

    if (remainingHours <= hoursLeftInDay) {
      // Can finish within current working day
      breachDate.setHours(breachDate.getHours() + remainingHours);
      remainingHours = 0;
    } else {
      // Need to continue to next working day
      remainingHours -= hoursLeftInDay;
      breachDate.setDate(breachDate.getDate() + 1);
      breachDate.setHours(workingStartHour, 0, 0, 0);
    }
  }

  return {
    breachDateISO: breachDate.toISOString(),
    breachTimestamp: breachDate.getTime(),
  };
}

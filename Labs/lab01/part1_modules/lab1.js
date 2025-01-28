import _ from "lodash";

const holidays = [
    { name: "New Year", date: "2026-01-01" },
    { name: "Valentine's Day", date: "2025-02-14" },
    { name: "Christmas", date: "2025-12-25" },
    { name: "Canada Day", date: "2025-07-01" },
    { name: "Halloween", date: "2025-10-31" },
    { name: "Thanksgiving", date: "2025-11-27" },
    { name: "Remembrance Day", date: "2025-11-11" },
    { name: "My Birthday", date: "2025-11-07" },
  ];

  function daysUntilHoliday(date) {
    const today = new Date();
    const holidayDate = new Date(date);
    const timeDiff = holidayDate - today;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); 
  }
  
  console.log("Days until each holiday:");
  holidays.forEach((holiday) => {
    console.log(`${holiday.name}: ${daysUntilHoliday(holiday.date)} days`);
  });
  
  const randomHoliday = _.sample(holidays);
  console.log("\nRandom holiday:");
  console.log(`${randomHoliday.name}: ${randomHoliday.date}`);
  
  const holidayNames = holidays.map((holiday) => holiday.name);
  console.log("\nIndexes of specific holidays:");
  console.log(`Christmas: ${_.indexOf(holidayNames, "Christmas")}`);
  console.log(`Canada Day: ${_.indexOf(holidayNames, "Canada Day")}`);
  console.log(`Remembrance Day: ${_.indexOf(holidayNames, "Remembrance Day")}`);
  console.log(`My Birthday: ${_.indexOf(holidayNames, "My Birthday")}`);
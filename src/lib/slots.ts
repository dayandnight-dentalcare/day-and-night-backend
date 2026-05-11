import { sql } from './db';

export async function isDateBlocked(date: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM BlockedDates WHERE date = ${date}::date LIMIT 1
  `;
  return rows.length > 0;
}

export async function seedSlotsIfNeeded(date: string): Promise<void> {
  const existing = await sql`
    SELECT 1 FROM TimeSlots WHERE date = ${date}::date LIMIT 1
  `;
  if (existing.length > 0) return;

  // Use the split method to avoid UTC shifting
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); 

  // Clinic working hours:
  // Mon–Sat: 9:30 AM – 7:30 PM
  // Sunday: 9:30 AM – 1:00 PM
  const endHour = dayOfWeek === 0 ? 13 : 19;
  const endMinute = dayOfWeek === 0 ? 0 : 30; // Changed to 30 to include the 7:30 slot

  const slotsToInsert: string[] = [];
  let h = 9, minuteCounter = 30; 

  while (h < endHour || (h === endHour && minuteCounter <= endMinute)) {
    slotsToInsert.push(`${String(h).padStart(2, '0')}:${String(minuteCounter).padStart(2, '0')}`);
    minuteCounter += 30;
    if (minuteCounter === 60) { 
      minuteCounter = 0; 
      h++; 
    }
  }

  for (const timeStr of slotsToInsert) {
    await sql`
      INSERT INTO TimeSlots (date, time, is_booked)
      VALUES (${date}::date, ${timeStr}::time, FALSE)
      ON CONFLICT DO NOTHING
    `;
  }
}

export async function getAvailableSlots(
  date: string
): Promise<{ id: number; time: string }[]> {
  await seedSlotsIfNeeded(date);

  const todayIST = getTodayIST();
  
  // Get current time in IST (HH:mm)
  const nowIST = new Date().toLocaleTimeString('en-GB', { 
    timeZone: 'Asia/Kolkata', 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const rows = await sql`
    SELECT t.id, to_char(t.time, 'HH12:MI AM') AS slot_time
    FROM   TimeSlots t
    WHERE  t.date      = ${date}::date
      AND  t.is_booked = FALSE
      AND  (
        ${date} != ${todayIST} 
        OR t.time > ${nowIST}::time
      )
      AND  NOT EXISTS (
        SELECT 1 FROM BlockedSlots b
        WHERE  b.date = t.date AND b.time = t.time
      )
    ORDER BY t.time ASC
  `;

  return rows.map((row: any) => ({
    id: Number(row.id),
    time: String(row.slot_time),
  }));
}

export function getTodayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
import Papa from 'papaparse';

export interface ParsedSubscriber {
  email: string;
  name?: string;
}

export function parseCsv(csvText: string): ParsedSubscriber[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const subscribers: ParsedSubscriber[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const row of result.data) {
    const email = (row['email'] || row['e-mail'] || row['email address'] || '').trim();
    const name = (row['name'] || row['full name'] || row['first name'] || '').trim();

    if (email && emailRegex.test(email)) {
      subscribers.push({ email, name: name || undefined });
    }
  }

  return subscribers;
}

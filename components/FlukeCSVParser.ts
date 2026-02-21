// FlukeCSVParser.ts — Custom parser for Fluke Battery Meter CSV exports
// Handles the non-standard format: metadata header + multi-table layout

export interface FlukeMetadata {
  profileId: string;
  location: string;
  deviceName: string;
  deviceId: string;
  batterySeries: string;
  batteryType: string;
  batteryNumber: number;
  batteryStartId: number;
  capacity: string;
  timeCreated: string;
  timeModified: string;
  customValues: string[];
  tableName: string;
}

export interface FlukeCellReading {
  id: string;
  resistance: number;   // mΩ
  voltage: number;      // VDC
  temperature: number;  // ℃
  time: string;
}

export interface FlukeParseResult {
  metadata: FlukeMetadata;
  readings: FlukeCellReading[];
  stats: {
    totalCells: number;
    avgResistance: number;
    minResistance: number;
    maxResistance: number;
    stdDevResistance: number;
    avgVoltage: number;
    minVoltage: number;
    maxVoltage: number;
    stdDevVoltage: number;
    avgTemperature: number;
    minTemperature: number;
    maxTemperature: number;
    totalVoltage: number;
    testDurationMinutes: number;
  };
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function getMetaValue(lines: string[], key: string): string {
  for (const line of lines) {
    const parts = parseCSVLine(line);
    if (parts[0] === key) {
      return parts[1] || '';
    }
  }
  return '';
}

export function parseFlukeCSV(csvText: string): FlukeParseResult {
  const rawLines = csvText.split(/\r?\n/);
  const lines = rawLines.map(l => l.trim()).filter(l => l.length > 0);

  // --- 1. Extract Metadata (first ~17 lines, before Table1) ---
  const metaLines: string[] = [];
  let tableStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts[0] && parts[0].match(/^Table\d+$/i)) {
      tableStartIndex = i;
      break;
    }
    metaLines.push(lines[i]);
  }

  const customValues: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const val = getMetaValue(metaLines, `Custom Value ${i}`);
    if (val) customValues.push(val);
  }

  const metadata: FlukeMetadata = {
    profileId: getMetaValue(metaLines, 'Internal ProfileID'),
    location: getMetaValue(metaLines, 'Location'),
    deviceName: getMetaValue(metaLines, 'Device Name'),
    deviceId: getMetaValue(metaLines, 'Device ID'),
    batterySeries: getMetaValue(metaLines, 'Battery Series'),
    batteryType: getMetaValue(metaLines, 'Battery Type'),
    batteryNumber: parseInt(getMetaValue(metaLines, 'Battery Number')) || 0,
    batteryStartId: parseInt(getMetaValue(metaLines, 'Battery Start ID')) || 1,
    capacity: getMetaValue(metaLines, 'Capacity'),
    timeCreated: getMetaValue(metaLines, 'Time Created'),
    timeModified: getMetaValue(metaLines, 'Time Modified'),
    customValues,
    tableName: '',
  };

  // --- 2. Parse Table1 data rows ---
  const readings: FlukeCellReading[] = [];

  if (tableStartIndex >= 0) {
    // Table line: "Table1","mΩ-Volt (Temperature)"
    const tableParts = parseCSVLine(lines[tableStartIndex]);
    metadata.tableName = tableParts[1] || tableParts[0];

    // Skip separator line ("--------------------") and header line
    let dataStart = tableStartIndex + 1;
    // Skip separator
    if (dataStart < lines.length && lines[dataStart].includes('----')) {
      dataStart++;
    }
    // Skip header row (ID, Resistance, VDC, Temperature, Time)
    if (dataStart < lines.length) {
      const headerParts = parseCSVLine(lines[dataStart]);
      if (headerParts[0] === 'ID') {
        dataStart++;
      }
    }

    // Read data rows until next Table marker or separator-only line
    for (let i = dataStart; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);

      // Stop at next Table marker or binary section
      if (parts[0].match(/^Table\d+$/i)) break;
      if (parts[0].includes('----')) break;
      if (parts[0].includes('Below is for import')) break;
      if (parts[0].includes('<----')) break;

      // Parse data row: "001","0.35","2.246","0","2026-01-09 15:10:48"
      if (parts.length >= 4) {
        const id = parts[0];
        const resistance = parseFloat(parts[1]);
        const voltage = parseFloat(parts[2]);
        const temperature = parseFloat(parts[3]);
        const time = parts[4] || '';

        if (!isNaN(resistance) && !isNaN(voltage)) {
          readings.push({ id, resistance, voltage, temperature: isNaN(temperature) ? 0 : temperature, time });
        }
      }
    }
  }

  // --- 3. Compute Statistics ---
  const resistances = readings.map(r => r.resistance);
  const voltages = readings.map(r => r.voltage);
  const temperatures = readings.map(r => r.temperature);

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const stdDev = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const mean = avg(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - 1));
  };

  // Test duration
  let testDurationMinutes = 0;
  if (readings.length >= 2) {
    const firstTime = new Date(readings[0].time).getTime();
    const lastTime = new Date(readings[readings.length - 1].time).getTime();
    if (!isNaN(firstTime) && !isNaN(lastTime)) {
      testDurationMinutes = Math.round((lastTime - firstTime) / 60000 * 100) / 100;
    }
  }

  const stats = {
    totalCells: readings.length,
    avgResistance: Math.round(avg(resistances) * 1000) / 1000,
    minResistance: resistances.length ? Math.min(...resistances) : 0,
    maxResistance: resistances.length ? Math.max(...resistances) : 0,
    stdDevResistance: Math.round(stdDev(resistances) * 1000) / 1000,
    avgVoltage: Math.round(avg(voltages) * 1000) / 1000,
    minVoltage: voltages.length ? Math.min(...voltages) : 0,
    maxVoltage: voltages.length ? Math.max(...voltages) : 0,
    stdDevVoltage: Math.round(stdDev(voltages) * 1000) / 1000,
    avgTemperature: Math.round(avg(temperatures) * 10) / 10,
    minTemperature: temperatures.length ? Math.min(...temperatures) : 0,
    maxTemperature: temperatures.length ? Math.max(...temperatures) : 0,
    totalVoltage: Math.round(voltages.reduce((a, b) => a + b, 0) * 1000) / 1000,
    testDurationMinutes,
  };

  return { metadata, readings, stats };
}

export interface BloodPressureRead {
  id: number
  systolic: number
  diastolic: number
  pulse: number | null
  measured_at: string
  notes: string | null
}

export interface BloodPressureCreate {
  systolic: number
  diastolic: number
  pulse?: number
  measured_at: string
  notes?: string
}

export interface BloodPressureUpdate {
  systolic?: number | null
  diastolic?: number | null
  pulse?: number | null
  measured_at?: string | null
  notes?: string | null
}

export interface BloodGlucoseRead {
  id: number
  value: string
  measured_at: string
  notes: string | null
}

export interface BloodGlucoseCreate {
  value: number | string
  measured_at: string
  notes?: string
}

export interface BloodGlucoseUpdate {
  value?: number | string | null
  measured_at?: string | null
  notes?: string | null
}

export interface KetonesRead {
  id: number
  value: string
  measured_at: string
  notes: string | null
}

export interface KetonesCreate {
  value: number | string
  measured_at: string
  notes?: string
}

export interface KetonesUpdate {
  value?: number | string | null
  measured_at?: string | null
  notes?: string | null
}

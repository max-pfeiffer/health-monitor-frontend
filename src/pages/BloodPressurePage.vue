<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  useBloodPressureList,
  useCreateBloodPressure,
  useDeleteBloodPressure,
  useUpdateBloodPressure,
} from '@/composables/useBloodPressure'
import type { BloodPressureRead } from '@/types/api'

const { data: records, isLoading, isError } = useBloodPressureList()

const createMutation = useCreateBloodPressure()
const updateMutation = useUpdateBloodPressure()
const deleteMutation = useDeleteBloodPressure()

const dialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')

interface FormState {
  systolic: number | null
  diastolic: number | null
  pulse: number | null
  measured_at: string
  notes: string
}

const form = reactive<FormState>({
  systolic: null,
  diastolic: null,
  pulse: null,
  measured_at: '',
  notes: '',
})

const isSubmitting = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value,
)

const headers = [
  { title: 'Measured At', key: 'measured_at', sortable: true },
  { title: 'Systolic', key: 'systolic', sortable: true },
  { title: 'Diastolic', key: 'diastolic', sortable: true },
  { title: 'Pulse', key: 'pulse', sortable: true },
  { title: 'Notes', key: 'notes', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString()
}

function toDatetimeLocal(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16)
}

function showError(message: string) {
  snackbarText.value = message
  snackbar.value = true
}

function openCreate() {
  editingId.value = null
  form.systolic = null
  form.diastolic = null
  form.pulse = null
  form.measured_at = new Date().toISOString().slice(0, 16)
  form.notes = ''
  dialog.value = true
}

function openEdit(record: BloodPressureRead) {
  editingId.value = record.id
  form.systolic = record.systolic
  form.diastolic = record.diastolic
  form.pulse = record.pulse
  form.measured_at = toDatetimeLocal(record.measured_at)
  form.notes = record.notes ?? ''
  dialog.value = true
}

function openDelete(id: number) {
  deletingId.value = id
  deleteDialog.value = true
}

async function submit() {
  try {
    const payload = {
      systolic: form.systolic!,
      diastolic: form.diastolic!,
      ...(form.pulse != null ? { pulse: form.pulse } : {}),
      measured_at: new Date(form.measured_at).toISOString(),
      ...(form.notes ? { notes: form.notes } : {}),
    }
    if (editingId.value !== null) {
      await updateMutation.mutateAsync({ id: editingId.value, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    dialog.value = false
  } catch {
    showError('Failed to save. Please check your connection.')
  }
}

async function deleteRecord() {
  if (deletingId.value === null) return
  try {
    await deleteMutation.mutateAsync(deletingId.value)
    deleteDialog.value = false
  } catch {
    showError('Failed to delete. Please check your connection.')
  }
}
</script>

<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4">Blood Pressure</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Add</v-btn>
    </div>

    <v-alert v-if="isError" type="error" class="mb-4" variant="tonal">
      Failed to load records. Check your connection.
    </v-alert>

    <v-data-table
      :headers="headers"
      :items="records ?? []"
      :loading="isLoading"
      :sort-by="[{ key: 'measured_at', order: 'desc' }]"
    >
      <template #item.measured_at="{ item }">
        {{ formatDatetime(item.measured_at) }}
      </template>
      <template #item.pulse="{ item }">
        {{ item.pulse ?? '—' }}
      </template>
      <template #item.notes="{ item }">
        {{ item.notes ?? '—' }}
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEdit(item)" />
        <v-btn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click="openDelete(item.id)"
        />
      </template>
    </v-data-table>

    <!-- Create / Edit dialog -->
    <v-dialog v-model="dialog" max-width="480">
      <v-card>
        <v-card-title>{{ editingId !== null ? 'Edit' : 'Add' }} Blood Pressure</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.systolic"
                label="Systolic (mmHg)"
                type="number"
                :rules="[(v) => v != null || 'Required']"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.diastolic"
                label="Diastolic (mmHg)"
                type="number"
                :rules="[(v) => v != null || 'Required']"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="form.pulse" label="Pulse (bpm)" type="number" />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.measured_at"
                label="Measured at"
                type="datetime-local"
                :rules="[(v) => !!v || 'Required']"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="form.notes" label="Notes" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="isSubmitting" @click="submit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation -->
    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card>
        <v-card-title>Delete record?</v-card-title>
        <v-card-text>This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleteMutation.isPending.value" @click="deleteRecord">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="error" :timeout="4000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

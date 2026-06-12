<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  useCreateKetones,
  useDeleteKetones,
  useKetonesList,
  useUpdateKetones,
} from '@/composables/useKetones'
import type { KetonesRead } from '@/types/api'

const { data: records, isLoading, isError } = useKetonesList()

const createMutation = useCreateKetones()
const updateMutation = useUpdateKetones()
const deleteMutation = useDeleteKetones()

const dialog = ref(false)
const deleteDialog = ref(false)
const editingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')

interface FormState {
  value: number | null
  measured_at: string
  notes: string
}

const form = reactive<FormState>({ value: null, measured_at: '', notes: '' })

const isSubmitting = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value,
)

const headers = [
  { title: 'Measured At', key: 'measured_at', sortable: true },
  { title: 'Value (mmol/L)', key: 'value', sortable: true },
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
  form.value = null
  form.measured_at = new Date().toISOString().slice(0, 16)
  form.notes = ''
  dialog.value = true
}

function openEdit(record: KetonesRead) {
  editingId.value = record.id
  form.value = parseFloat(record.value)
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
      value: form.value!,
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
      <h1 class="text-h4">Ketones</h1>
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

    <v-dialog v-model="dialog" max-width="440">
      <v-card>
        <v-card-title>{{ editingId !== null ? 'Edit' : 'Add' }} Ketones</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.value"
                label="Value (mmol/L)"
                type="number"
                step="0.1"
                :rules="[(v) => v != null || 'Required']"
              />
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

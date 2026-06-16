<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useClassesStore } from "@/stores/useClassesStore";
import { useStudentsStore } from "@/stores/useStudentsStore";
import { useMonthsStore } from "@/stores/useMonthsStore";
import type { Class, Student } from "@/types";
import { computeMonth } from "@/composables/useBillingCompute";
import { monthOf, todayISO, formatVnd } from "@/lib/dates";
import { normalizeText } from "@/lib/search";
import MonthPicker from "@/components/MonthPicker.vue";
import MoneyText from "@/components/MoneyText.vue";
import PageHeader from "@/components/PageHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

interface Row {
  student: Student;
  cls: Class;
  confirmed: number;
  status: "paid" | "unpaid";
}
type StatusFilter = "all" | "paid" | "unpaid";

const router = useRouter();
const classes = useClassesStore();
const students = useStudentsStore();
const months = useMonthsStore();

const month = ref(monthOf(todayISO()));
const rows = ref<Row[]>([]);
const loading = ref(false);
const saving = ref(false);
const classList = ref<Class[]>([]);

const filterOpen = ref(false); // mặc định thu nhỏ
const draft = reactive<{ name: string; classId: string | null; phone: string; status: StatusFilter }>({
  name: "",
  classId: null,
  phone: "",
  status: "all",
});
// Bộ lọc đang áp dụng (chỉ đổi khi bấm "Tìm kiếm").
const applied = ref<{ name: string; classId: string | null; phone: string; status: StatusFilter }>({
  name: "",
  classId: null,
  phone: "",
  status: "all",
});

const classOptions = computed(() =>
  classList.value.map((c) => ({ title: c.name, value: c.id as string | null })),
);
// Bắt đầu chưa tải gì — phải chọn lớp & bấm Tìm kiếm (tiết kiệm reads).
const hasSearched = ref(false);
const statusOptions = [
  { title: "Tất cả", value: "all" },
  { title: "Đã thu", value: "paid" },
  { title: "Chưa thu", value: "unpaid" },
];

async function load(): Promise<void> {
  const classId = applied.value.classId;
  rows.value = [];
  if (!classId) return; // chưa chọn lớp → không đọc gì
  const cls = classList.value.find((c) => c.id === classId);
  if (!cls) return;
  loading.value = true;
  try {
    const ym = month.value;
    const stuList = await students.listByClass(cls.id, "active");
    // Đọc month-doc của tất cả HS SONG SONG (Promise.all) thay vì tuần tự trong vòng lặp:
    // số reads không đổi nhưng thời gian chờ giảm từ N×latency xuống ~1 round-trip.
    const result = await Promise.all(
      stuList.map(async (stu) => {
        const md = await months.get(stu.id, ym, false);
        const r = computeMonth({ cls, student: stu, monthDoc: md, yearMonth: ym });
        return { student: stu, cls, confirmed: r.totals.confirmedAmount, status: r.paymentStatus };
      }),
    );
    // Bỏ kết quả cũ nếu người dùng đã đổi tháng/lớp trong lúc chờ (tránh ghi đè dữ liệu mới).
    if (ym === month.value && applied.value.classId === classId) rows.value = result;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  classList.value = await classes.list("active");
});
// Đổi tháng chỉ tải lại nếu đã chọn lớp & đã tìm.
watch(month, () => {
  if (hasSearched.value && applied.value.classId) void load();
});

function runSearch(): void {
  if (!draft.classId) return;
  applied.value = { ...draft };
  hasSearched.value = true;
  void load();
}

function clearFilter(): void {
  draft.name = "";
  draft.classId = null;
  draft.phone = "";
  draft.status = "all";
  applied.value = { ...draft };
  hasSearched.value = false;
  rows.value = [];
}

// name/phone/status lọc trong tập đã tải.
const filteredRows = computed(() => {
  const f = applied.value;
  const nameQ = normalizeText(f.name);
  const phoneQ = f.phone.trim();
  return rows.value.filter((r) => {
    if (f.status !== "all" && r.status !== f.status) return false;
    if (nameQ && !normalizeText(r.student.name).includes(nameQ)) return false;
    if (phoneQ && !(r.student.parentPhone || "").includes(phoneQ)) return false;
    return true;
  });
});

const tableItems = computed(() =>
  filteredRows.value.map((r) => ({
    id: r.student.id,
    name: r.student.name,
    className: r.cls.name,
    phone: r.student.parentPhone || "—",
    confirmed: r.confirmed,
    status: r.status,
  })),
);

const activeFilterCount = computed(() => {
  const f = applied.value;
  let n = 0;
  if (f.name.trim()) n++;
  if (f.classId) n++;
  if (f.phone.trim()) n++;
  if (f.status !== "all") n++;
  return n;
});

const filterSummary = computed(() => {
  const f = applied.value;
  const parts: string[] = [];
  if (f.classId) parts.push(classList.value.find((c) => c.id === f.classId)?.name ?? "Lớp");
  if (f.status === "paid") parts.push("Đã thu");
  if (f.status === "unpaid") parts.push("Chưa thu");
  if (f.name.trim()) parts.push(`Tên: ${f.name.trim()}`);
  if (f.phone.trim()) parts.push(`SĐT: ${f.phone.trim()}`);
  return parts.length ? parts.join(" · ") : "Chưa chọn lớp";
});

function openStudent(_e: unknown, row: { item: { id: string } }): void {
  router.push({ name: "admin-student-detail", params: { studentId: row.item.id } });
}

const confirmToggle = ref<{
  open: boolean;
  studentId: string | null;
  name: string;
  confirmed: number;
  toPaid: boolean;
}>({ open: false, studentId: null, name: "", confirmed: 0, toPaid: false });

function askToggle(item: { id: string; name: string; confirmed: number; status: string }, toPaid: boolean): void {
  confirmToggle.value = { open: true, studentId: item.id, name: item.name, confirmed: item.confirmed, toPaid };
}

const confirmMessage = computed(() => {
  const c = confirmToggle.value;
  return c.toPaid
    ? `Đánh dấu "${c.name}" ĐÃ THU ${formatVnd(c.confirmed)} cho tháng này?`
    : `Chuyển "${c.name}" về CHƯA THU cho tháng này?`;
});

async function doToggle(): Promise<void> {
  const c = confirmToggle.value;
  if (!c.studentId) return;
  saving.value = true;
  try {
    if (c.toPaid) await months.markPaid(c.studentId, month.value, c.confirmed);
    else await months.unmarkPaid(c.studentId, month.value);
    // Cập nhật tại chỗ thay vì load() lại — tránh đọc lại month-doc của mọi học sinh.
    const row = rows.value.find((r) => r.student.id === c.studentId);
    if (row) row.status = c.toPaid ? "paid" : "unpaid";
    confirmToggle.value = { open: false, studentId: null, name: "", confirmed: 0, toPaid: false };
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Học phí"
      subtitle="Tổng hợp học phí theo tháng"
      icon="mdi-cash-multiple"
    >
      <template #actions>
        <MonthPicker v-model="month" />
      </template>
    </PageHeader>

    <!-- Bộ lọc tìm kiếm (mặc định thu nhỏ) -->
    <v-card class="mb-4">
      <v-list-item
        class="py-3"
        @click="filterOpen = !filterOpen"
      >
        <template #prepend>
          <v-icon icon="mdi-filter-variant" />
        </template>
        <v-list-item-title class="font-weight-medium">
          Bộ lọc tìm kiếm
          <v-chip
            v-if="activeFilterCount"
            size="x-small"
            color="primary"
            variant="flat"
            class="ml-2"
          >
            {{ activeFilterCount }}
          </v-chip>
        </v-list-item-title>
        <v-list-item-subtitle>{{ filterSummary }}</v-list-item-subtitle>
        <template #append>
          <v-icon :icon="filterOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
        </template>
      </v-list-item>

      <v-expand-transition>
        <div v-show="filterOpen">
          <v-divider />
          <div class="pa-4">
            <v-row dense>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="draft.name"
                  label="Tên học sinh"
                  prepend-inner-icon="mdi-account-search"
                  clearable
                  hide-details
                  @keyup.enter="runSearch"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="draft.classId"
                  :items="classOptions"
                  label="Lớp *"
                  placeholder="Chọn lớp"
                  prepend-inner-icon="mdi-google-classroom"
                  hide-details
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="draft.phone"
                  label="SĐT phụ huynh"
                  prepend-inner-icon="mdi-phone"
                  inputmode="tel"
                  clearable
                  hide-details
                  @keyup.enter="runSearch"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-select
                  v-model="draft.status"
                  :items="statusOptions"
                  label="Trạng thái thu tiền"
                  prepend-inner-icon="mdi-cash-check"
                  hide-details
                />
              </v-col>
            </v-row>
            <div class="d-flex justify-end ga-2 mt-4">
              <v-btn
                variant="text"
                :disabled="loading"
                @click="clearFilter"
              >
                Xoá lọc
              </v-btn>
              <v-btn
                color="primary"
                variant="flat"
                prepend-icon="mdi-magnify"
                :loading="loading"
                :disabled="!draft.classId"
                @click="runSearch"
              >
                Tìm kiếm
              </v-btn>
            </div>
          </div>
        </div>
      </v-expand-transition>
    </v-card>

    <v-row v-if="hasSearched && !loading && filteredRows.length">
      <v-col
        cols="12"
        sm="6"
      >
        <v-card class="pa-5">
          <div class="text-body-medium text-medium-emphasis">
            Tổng học phí (đã chốt)
          </div>
          <MoneyText
            :value="filteredRows.reduce((s, r) => s + r.confirmed, 0)"
            class="text-headline-medium font-weight-bold"
          />
        </v-card>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-card class="pa-5">
          <div class="text-body-medium text-medium-emphasis">
            Đã thu
          </div>
          <div class="text-headline-medium font-weight-bold">
            {{ filteredRows.filter((r) => r.status === 'paid').length }}/{{ filteredRows.length }}
            <span class="text-body-medium text-medium-emphasis font-weight-regular">học sinh</span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-3">
      <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
      />
      <EmptyState
        v-else-if="!hasSearched"
        title="Chọn lớp để xem học phí"
        subtitle="Mở bộ lọc, chọn một lớp rồi bấm Tìm kiếm. Học phí chỉ tải khi bạn chọn lớp (tiết kiệm dữ liệu)."
        icon="mdi-magnify"
      >
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-filter-variant"
          @click="filterOpen = true"
        >
          Mở bộ lọc
        </v-btn>
      </EmptyState>
      <EmptyState
        v-else-if="rows.length === 0"
        title="Lớp này chưa có học sinh / dữ liệu"
        subtitle="Chọn tháng khác hoặc thêm học sinh vào lớp."
        icon="mdi-cash-remove"
      />
      <EmptyState
        v-else-if="filteredRows.length === 0"
        title="Không tìm thấy kết quả"
        subtitle="Thử đổi điều kiện lọc."
        icon="mdi-filter-remove-outline"
      />
      <v-data-table
        v-else
        :headers="[
          { title: 'Học sinh', key: 'name' },
          { title: 'Lớp', key: 'className' },
          { title: 'SĐT phụ huynh', key: 'phone' },
          { title: 'Học phí', key: 'confirmed', align: 'end' },
          { title: 'Đã thu', key: 'toggle', sortable: false, align: 'center' },
          { title: '', key: 'actions', sortable: false, align: 'end' },
        ]"
        :items="tableItems"
        @click:row="openStudent"
      >
        <template #[`item.name`]="{ item }">
          <span class="font-weight-medium">{{ item.name }}</span>
        </template>
        <template #[`item.phone`]="{ item }">
          <span class="tnum">{{ item.phone }}</span>
        </template>
        <template #[`item.confirmed`]="{ item }">
          <MoneyText
            :value="item.confirmed"
            class="font-weight-medium"
          />
        </template>
        <template #[`item.toggle`]="{ item }">
          <div
            class="d-flex align-center justify-center"
            @click.stop="askToggle(item, item.status !== 'paid')"
          >
            <v-switch
              :model-value="item.status === 'paid'"
              color="success"
              density="compact"
              hide-details
              inset
              readonly
              :disabled="saving"
            />
          </div>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            append-icon="mdi-chevron-right"
            @click.stop="router.push({ name: 'admin-student-detail', params: { studentId: item.id } })"
          >
            Chi tiết
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <ConfirmDialog
      v-model="confirmToggle.open"
      :title="confirmToggle.toPaid ? 'Xác nhận đã thu' : 'Xác nhận chưa thu'"
      :message="confirmMessage"
      :destructive="!confirmToggle.toPaid"
      @confirm="doToggle"
    />
  </div>
</template>

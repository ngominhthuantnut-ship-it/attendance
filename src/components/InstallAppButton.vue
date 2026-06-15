<script setup lang="ts">
import { ref, computed } from "vue";
import { usePwaInstall } from "@/composables/usePwaInstall";

withDefaults(defineProps<{ block?: boolean; variant?: "flat" | "tonal" | "text" }>(), {
  block: false,
  variant: "tonal",
});

const { canInstall, standalone, ios, install } = usePwaInstall();
const iosHelp = ref(false);

// Hiện nút khi: chưa cài (không ở chế độ standalone) VÀ (có thể cài qua prompt HOẶC là iOS).
const show = computed(() => !standalone && (canInstall.value || ios));

async function onClick(): Promise<void> {
  if (canInstall.value) {
    await install();
  } else if (ios) {
    iosHelp.value = true;
  }
}
</script>

<template>
  <template v-if="show">
    <v-btn
      :block="block"
      :variant="variant"
      color="primary"
      prepend-icon="mdi-download"
      @click="onClick"
    >
      Cài đặt ứng dụng
    </v-btn>

    <v-dialog
      v-model="iosHelp"
      max-width="420"
    >
      <v-card rounded="xl">
        <v-card-item>
          <template #prepend>
            <v-avatar
              color="primary"
              variant="tonal"
              rounded="lg"
            >
              <v-icon icon="mdi-cellphone-arrow-down" />
            </v-avatar>
          </template>
          <v-card-title>Cài đặt trên iPhone/iPad</v-card-title>
        </v-card-item>
        <v-divider />
        <v-card-text>
          <ol class="ps-5">
            <li class="mb-2">
              Mở bằng <strong>Safari</strong>.
            </li>
            <li class="mb-2">
              Bấm nút <strong>Chia sẻ</strong>
              <v-icon
                icon="mdi-export-variant"
                size="small"
              />
              ở thanh dưới.
            </li>
            <li class="mb-2">
              Chọn <strong>“Thêm vào MH chính” (Add to Home Screen)</strong>.
            </li>
            <li>Bấm <strong>Thêm</strong> — biểu tượng app sẽ xuất hiện trên màn hình.</li>
          </ol>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="iosHelp = false"
          >
            Đã hiểu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
</template>

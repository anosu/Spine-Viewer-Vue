import {defineStore} from "pinia";
import {reactive, ref, watch} from "vue";

import i18n from "@/utils/lang";

export const useExportStore = defineStore('export', () => {
    let display = ref(false)
    let running = ref(false)
    let status = ref()
    let options = reactive({
        format: 'GIF',
        framerate: 24,
        filename: 'output',
        path: '',
    })
    let progress = reactive({
        current: 0,
        total: 1,
    })

    function hide() {
        display.value = false
    }

    function show() {
        display.value = true
    }

    function setStatus(stat) {
        status.value = stat
    }

    function setProgress(currentValue, totalValue = progress.total) {
        progress.current = currentValue
        progress.total = totalValue
    }

    function renderComplete() {
        return progress.current >= progress.total
    }

    watch(() => i18n.global.t('export.export'), value => status.value = value, {immediate: true})

    return {display, running, status, options, progress, hide, show, setStatus, setProgress, renderComplete}
})

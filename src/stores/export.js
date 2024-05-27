import {defineStore} from "pinia";
import {reactive, ref} from "vue";

export const useExportStore = defineStore('export', () => {
    let display = ref(false)
    let running = ref(false)
    let status = ref('导出')
    let options = reactive({
        format: 'GIF',
        framerate: 24,
        filename: 'out',
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

    return {display, running, status, options, progress, hide, show, setStatus, setProgress, renderComplete}
})

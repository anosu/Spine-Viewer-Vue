import {defineStore} from "pinia";
import {computed, reactive, ref} from "vue";
import {swap} from "@/utils/util";
import {Container} from "@/utils/viewer";

export const useAppStore = defineStore('app', () => {
    let items = reactive([])
    items.changed = false
    let containers = []
    let activeIndex = ref(0)
    let active = computed(() => ({
        index: activeIndex.value,
        container: containers[activeIndex.value],
        count: computed(() => items.length).value,
        changed: items.changed
    }))
    let superposition = ref(false)
    let skinCombination = ref(false)

    function getActive() {
        return containers[activeIndex.value]
    }

    function addContainer(x, y, name) {
        const container = new Container(x, y, name)
        items.push(name)
        containers.push(container)
        activeIndex.value = containers.length - 1
    }

    function removeContainer() {
        items.splice(activeIndex.value, 1)
        containers.splice(activeIndex.value, 1)
        activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : 0
    }

    function shiftUpContainer() {
        if (activeIndex.value <= 0) return
        swap(items, activeIndex.value, activeIndex.value - 1)
        swap(containers, activeIndex.value, activeIndex.value - 1)
        activeIndex.value -= 1
    }

    function shiftDownContainer() {
        if (activeIndex.value >= containers.length) return
        swap(items, activeIndex.value, activeIndex.value + 1)
        swap(containers, activeIndex.value, activeIndex.value + 1)
        activeIndex.value += 1
    }

    function reset() {
        items.length = 0
        containers.length = 0
        activeIndex.value = 0
    }

    return {
        items,
        active,
        containers,
        activeIndex,
        superposition,
        skinCombination,
        getActive,
        addContainer,
        removeContainer,
        shiftUpContainer,
        shiftDownContainer,
        reset
    }
})
import {defineStore} from "pinia";
import {ref} from "vue";

export const useSceneStore = defineStore('scene', () => {
    let _backgroundColor = '#616066'
    let backgroundColor = ref('#616066')
    let transparent = ref(true)

    function saveColor(color) {
        _backgroundColor = color
    }

    function getSavedColor() {
        return _backgroundColor
    }

    return {backgroundColor, transparent, saveColor, getSavedColor}
})

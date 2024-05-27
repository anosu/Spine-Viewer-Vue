import {swap} from "@/utils/util";

export default (appStore, pixiApp) => {
    const addContainer = () => {
        appStore.addContainer(pixiApp.view.clientWidth / 2, pixiApp.view.clientHeight / 2, 'Container')
        pixiApp.stage.addChild(appStore.getActive().stage)
    }

    const removeContainer = () => {
        if (appStore.active.count <= 1) return
        pixiApp.stage.removeChildAt(appStore.activeIndex)
        appStore.removeContainer()
    }

    const shiftUpContainer = () => {
        if (appStore.activeIndex <= 0) return
        swap(pixiApp.stage.children, appStore.activeIndex, appStore.activeIndex - 1)
        appStore.shiftUpContainer()
    }

    const shiftDownContainer = () => {
        if (appStore.activeIndex >= appStore.active.count - 1) return
        swap(pixiApp.stage.children, appStore.activeIndex, appStore.activeIndex + 1)
        appStore.shiftDownContainer()
    }

    const resetAll = () => {
        appStore.reset()
        appStore.addContainer(pixiApp.view.clientWidth / 2, pixiApp.view.clientHeight / 2, 'Container')
        pixiApp.stage.removeChildren()
        pixiApp.stage.addChild(appStore.getActive().stage)
        appStore.items.changed = !appStore.items.changed
    }

    const playAllAnimationQueue = () => {
        const standard = {
            index: 0,
            duration: 0
        }
        appStore.containers.forEach((c, i) => {
            const info = c.getQueueInfo()
            if (info.totalDuration > standard.duration) {
                standard.index = i
                standard.duration = info.totalDuration
            }
        })
        appStore.containers.forEach((c, i) => {
            const callback = i === standard.index ? cancelAllHidden : console.log
            c.playAnimationQueue(callback)
        })
    }

    const cancelAllHidden = () => {
        appStore.containers.forEach(c => {
            c.stage.alpha = 1
            c.data.tracks.length = 0
            for (let i = 0; i < 7; i++) {
                c.setEmptyAnimation(i, 0)
            }
        })
    }

    return {
        addContainer,
        removeContainer,
        shiftUpContainer,
        shiftDownContainer,
        resetAll,
        playAllAnimationQueue,
        cancelAllHidden
    }
}

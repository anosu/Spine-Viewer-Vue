import * as PIXI from "pixi.js";
import {computed, reactive, ref} from "vue";
import {Spine} from "pixi-spine";

export class Container {
    constructor(x, y, name) {
        this.name = name
        this.stage = new PIXI.Container()
        this.textures = []
        this.background = null
        this.spineVersion = ref('')
        this.data = reactive({
            position: {
                _x: 0,
                x: computed({
                    get: () => {
                        return this.data.position._x
                    },
                    set: (x) => {
                        this.stage.children.forEach(a => a instanceof Spine && (a.x = x))
                        this.data.position._x = x
                    }
                }),
                _y: 0,
                y: computed({
                    get: () => {
                        return this.data.position._y
                    },
                    set: (y) => {
                        this.stage.children.forEach(a => a instanceof Spine && (a.y = y))
                        this.data.position._y = y
                    }
                })
            },
            _zoom: 1,
            zoom: computed({
                get: () => {
                    return this.data._zoom
                },
                set: (value) => {
                    this.stage.children.forEach(a => a instanceof Spine && a.scale.set(value))
                    this.data._zoom = value
                }
            }),
            _timeScale: 1,
            timeScale: computed({
                get: () => {
                    return this.data._timeScale
                },
                set: (value) => {
                    this.stage.children.forEach(a => {
                        a.state.timeScale = value
                    })
                    this.data._timeScale = value
                }
            }),
            _defaultMix: 0,
            defaultMix: computed({
                get: () => {
                    return this.data._defaultMix
                },
                set: (value) => {
                    this.stage.children.forEach(a => {
                        a.state.data.defaultMix = value
                    })
                    this.data._defaultMix = value
                }
            }),
            _alphaMode: 1,
            alphaMode: computed({
                get: () => {
                    return this.data._alphaMode
                },
                set: (value) => {
                    this.textures.forEach(t => {
                        t.alphaMode = value
                        t.update()
                    })
                    this.data._alphaMode = value
                }
            }),
            _scaleMode: 1,
            scaleMode: computed({
                get: () => {
                    return this.data._scaleMode
                },
                set: (value) => {
                    this.textures.forEach(t => {
                        t.scaleMode = value
                        // t.update()
                    })
                    this.data._scaleMode = value
                }
            }),
            skins: [],
            animations: [],
            tracks: [],
            queue: [
                [], [], [], [], [], [], []
            ],
            slots: [],
            slotKey: ''
        })
        this.data.position.x = x
        this.data.position.y = y
        this.data.skins.checked = ''
        this.data.tracks.checked = 0
        this.data.queue.checked = 0
    }

    setSkin(skinName) {
        this.stage.children.forEach(a => {
            if (a.skeleton?.data.skins.some(s => s.name === skinName)) {
                a.skeleton.setSkinByName(skinName)
                a.skeleton.setSlotsToSetupPose()
            }
        })
    }

    setAnimation(trackIndex, animationName, loop) {
        this.stage.children.forEach(a => {
            a.state?.setAnimation(trackIndex, animationName, loop)
        })
    }

    addAnimation(trackIndex, animationName, loop) {
        this.stage.children.forEach(a => {
            a.state?.addAnimation(trackIndex, animationName, loop, 0)
        })
    }

    setEmptyAnimation(trackIndex, mixTime) {
        this.stage.children.forEach(a => {
            a.state?.setEmptyAnimation(trackIndex, mixTime)
        })
    }

    addEmptyAnimation(trackIndex, mixTime) {
        this.stage.children.forEach(a => {
            a.state?.addEmptyAnimation(trackIndex, mixTime, 0)
        })
    }

    pauseAnimation() {
        this.stage.children.forEach(a => {
            a.state && (a.state.timeScale = 0)
        })
    }

    setAutoUpdate(value) {
        this.stage.children.forEach(a => {
            a.autoUpdate = value
        })
    }

    update(delta) {
        this.stage.children.forEach(a => {
            a.update?.(delta)
        })
    }

    setBackgroundImage(url, x, y) {
        const background = new PIXI.Sprite.from(url)
        background.anchor.set(0.5)
        background.position.set(x, y)
        if (this.background) this.stage.removeChildAt(0)
        this.stage.addChildAt(background, 0)
        this.background = background
    }

    removeBackgroundImage() {
        if (!this.background) return
        this.stage.removeChildAt(0)
        this.background = null
    }

    getQueueInfo() {
        const info = {
            trackIndex: 0,
            animationNumber: 0,
            totalDuration: 0
        }
        for (let i = 0; i < 7; i++) {
            if (this.data.queue[i].length === 0) continue
            const totalDuration = this.data.queue[i].reduce((d, a) => d + a.duration, 0) / this.data.timeScale
            if (totalDuration > info.totalDuration) {
                info.trackIndex = i
                info.animationNumber = this.data.queue[i].filter(a => a.name !== null && a.name !== undefined).length
                info.totalDuration = totalDuration
            }
        }
        return info
    }

    playAnimationQueue(onComplete = console.log) {
        const info = this.getQueueInfo()
        if (info.animationNumber === 0 || info.totalDuration === 0) return
        // TODO: clear existed track

        for (let i = 0; i < 7; i++) {
            if (this.data.queue[i].length === 0) continue

            this.setAnimation(i, this.data.queue[i][0].name, false)

            for (let j = 1; j < this.data.queue[i].length - 1; j++) {
                this.addAnimation(i, this.data.queue[i][j].name, false)
            }

            const lastAnimation = this.data.queue[i][this.data.queue[i].length - 1].name
            switch (lastAnimation) {
                case null:
                    this.addEmptyAnimation(i, this.data.defaultMix)
                    break
                case undefined:
                    let animationIndex = 0
                    const spineIndex = this.background ? 1 : 0
                    this.stage.children[spineIndex].state.tracks[i].listener = {
                        complete: () => {
                            if (animationIndex++ === this.data.queue[i].length - 2) {
                                this.stage.alpha = 0
                                this.stage.children[spineIndex].state.tracks[i].listener = null
                            }
                        }
                    }
                    break
                default:
                    if (this.data.queue[i].length > 1) {
                        this.addAnimation(i, lastAnimation, false)
                    }
            }
            if (i === info.trackIndex) {
                let animationIndex = 0
                const spineIndex = this.background ? 1 : 0
                this.stage.children[spineIndex].state.tracks[i].listener = {
                    complete: () => {
                        if (++animationIndex === info.animationNumber) {
                            onComplete()
                            this.stage.children[spineIndex].state.tracks[i].listener = null
                        }
                    }
                }
            }
        }
    }

    addToQueue(trackIndex, animationName) {
        const names = this.data.queue[trackIndex].map(a => a.name)
        if (names.includes(null) || names.includes(undefined)) {
            return
        }
        this.data.queue[trackIndex].push(animationName)
    }

    addEmptyToQueue(trackIndex) {
        if (this.data.queue[trackIndex].length === 0) return
        const lastAnimation = this.data.queue[trackIndex][this.data.queue[trackIndex].length - 1]
        if (lastAnimation.name !== null && lastAnimation.name !== undefined) {
            this.data.queue[trackIndex].push({name: null, duration: 0})
        } else {
            lastAnimation.name = null
        }
    }

    addHiddenToQueue(trackIndex) {
        if (this.data.queue[trackIndex].length === 0) return
        const lastAnimation = this.data.queue[trackIndex][this.data.queue[trackIndex].length - 1]
        if (lastAnimation.name !== null && lastAnimation.name !== undefined) {
            this.data.queue[trackIndex].push({name: undefined, duration: 0})
        } else {
            lastAnimation.name = undefined
        }
    }

    clearQueue(trackIndex) {
        this.data.queue[trackIndex] = []
    }
}

import kaboom, { AreaComp, BodyComp, GameObj, KaboomCtx, PosComp, Rect, RectComp, SpriteComp, Tag } from "kaboom"

const GAME_CONSTS = {
    SCENE_GRAVITY: 4000,
    MAX_JUMP_VELOCITY: 1200,
    BASE_JUMP_VELOCITY: 500,
    JUMP_VELOCITY_CHARGE_RATE: 10,
    GAME_WIDTH: 640,
    GAME_HEIGHT: 320,
    INITIAL_SCORE_SIZE: 18,
    CAMERA_Y_OFFSET: 32,
    SCORE_TEXT: (score: number) => `Mom-o-meter: ${score}`,
}


const randomDirt = (): string => {
    /* Randomize array in-place using Durstenfeld shuffle algorithm */
    function shuffleArray(array: string[]) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array
    }
    return shuffleArray("dddddddddddd[[[[[]]]]].....".split("")).join("")
}
const BACKFILL_DIRT = [randomDirt(), randomDirt(), randomDirt(), randomDirt(), randomDirt(), randomDirt(),]

export const doGame = (rootEl: HTMLElement | undefined): void => {
    let game = kaboom({ scale: 5, root: rootEl, stretch: true, height: GAME_CONSTS.GAME_HEIGHT, width: GAME_CONSTS.GAME_WIDTH, global: false })

    //Mutable game vars
    let jumpVelocity = GAME_CONSTS.BASE_JUMP_VELOCITY

    game.loadBean()
    game.loadAseprite('coffee', './coffee.png', './coffee.json')
    game.loadAseprite('dirt', './dirt.png', './dirt.json')
    game.loadSprite('grass',
        '/grass.png')
    game.loadAseprite('mom', '/mom.png', '/mom.json')
    game.loadAseprite('dino', '/dino-small.png', '/dino-small.json')
    game.loadAseprite('pretzle', '/pretzle.png', '/pretzle.json')
    game.loadAseprite('truck', '/monster-truck-template.png', '/monster-truck-template.json')
    game.setBackground(245, 225, 255)
    game.setGravity(GAME_CONSTS.SCENE_GRAVITY)

    game.loadSpriteAtlas('stone_packed.png', {
        stone1: {
            x: 0,
            y: 0,
            width: 19,
            height: 19
        }
    })

    const truckTemplate = [
        game.sprite('truck', { width: 30, height: 30, anim: 'left', animSpeed: 2 }),
        game.pos(),
        game.area({ scale: 0.75, collisionIgnore: ["bucket"] }),
        game.body(),
        "truck"
    ]
    game.addLevel([
        "w                                                                                         $w",
        "w                                                                                         $w",
        "w                                                                                         $w",
        "w                                                                                         $w",
        "w                         %                                                               cw",
        "w                   ====                                                                  $w",
        "w                                                %                                        cw",
        "w                                        %       %                                        $w",
        "w               %               %       %%       %                 B       B           B   w",
        "w             %%%              %%     %%%       %                                   t     &w",
        "==================================================== ===========================================",
    ], {
        tileWidth: 32,
        tileHeight: 32,
        pos: game.vec2(0, 0),
        tiles: {
            "=": () => [
                game.sprite("grass", { width: 32, height: 32 }),
                game.area({ scale: 1, offset: new game.Vec2(0, 8) }),
                game.body({ isStatic: true }),
            ],
            "$": () => [
                game.sprite("pretzle", { anim: 'sparkle', }),
                game.area({ scale: 0.75, collisionIgnore: ["truck"] }),
                game.body({ isStatic: true }),
                "power-up"
            ],
            "c": () => [
                game.sprite("coffee", { anim: 'wiggle', }),
                game.area({ scale: 0.75, collisionIgnore: ["truck"] }),
                game.body({ isStatic: true }),
                "power-up"
            ],
            "d": () => [
                game.sprite("dirt",),
                game.area({ scale: 1 }),
                game.body({ isStatic: true }),
                'ground'
            ],
            "%": () => [
                game.sprite("stone1", { width: 32, height: 32 }),
                game.area({ scale: 1 }),
                game.body({ isStatic: true }),
                "ground"
            ],
            "t": () => truckTemplate,
            "B": () => [
                game.rect(60, 60),
                game.pos(),
                game.area({ collisionIgnore: ["truck", 'ground'] }),
                game.body(),
                game.color(game.YELLOW),
                "bucket"
            ]

        }
    })

    game.onLoad(() => {
        game.get("pretzle").map(_pretzle => {
            let pretzle = _pretzle as GameObj<SpriteComp>
            pretzle.play("sparkle", { pingpong: true, speed: 0.5, loop: true })
        })
    })
    const bean = game.add([
        game.sprite("dino", { frame: 0, width: 48, height: 48 }),
        game.pos(2752, 168),
        game.area({ scale: 0.75 }),
        game.body(),
        game.anchor("center"),
        "mom"
    ])
    let score = 0
    const score_text = game.add([
        game.text(GAME_CONSTS.SCORE_TEXT(score), { size: GAME_CONSTS.INITIAL_SCORE_SIZE }),
        game.fixed()
    ])

    let resetScoreTimeout: number | undefined = undefined
    const updateScore = (reason: string) => {
        score += 100
        score_text.text = GAME_CONSTS.SCORE_TEXT(score)
        score_text.textTransform = { scale: 1.3, color: new game.Color(200, 100, 100) }
        clearTimeout(resetScoreTimeout);
        resetScoreTimeout = setTimeout(() => {
            score_text.textTransform = { scale: 1, color: game.WHITE }
        }, 1000)
    }
    game.onKeyDown('space', () => {
        bean.stop();
        //charge the jump 
        jumpVelocity += GAME_CONSTS.JUMP_VELOCITY_CHARGE_RATE
    })
    game.onKeyPress('space', () => {
        if (!bean.isGrounded()) {
            return;
        }
        if (game.isKeyDown('left')) {
            bean.move(-100, 0)
        }
        if (game.isKeyDown('right')) {
            bean.move(100, 0)
        }
        bean.frame = 1
        // game.setBackground(game.CYAN)
    })
    game.onKeyRelease('space', () => {
        bean.frame = 0

        if (bean.isGrounded()) {
            bean.jump(Math.min(jumpVelocity, GAME_CONSTS.MAX_JUMP_VELOCITY))
        }
        jumpVelocity = GAME_CONSTS.BASE_JUMP_VELOCITY
    })

    let walkInterval: number | undefined;
    function move(x: number) {
        if (bean.curAnim() !== 'walk' && !game.isKeyDown('space')) {
            try {
                bean.play('walk', { loop: true, speed: 3 })
            }
            catch (e) { }
        }
        bean.move(x, 0)

        //platformer wrapping logic
        // if (bean.pos.x < 0) {
        //     bean.pos.x = game.width()
        // } else if (bean.pos.x > game.width()) {
        //     bean.pos.x = 0
        // }
    }
    game.onKeyDown('left', () => {
        move(-200)
    })
    game.onKeyDown('right', () => {
        move(200)
    })

    //Reset the player to the initial frame 
    game.onKeyRelease('right', () => {
        bean.stop()
        bean.frame = 0
        walkInterval = undefined;
    })
    game.onKeyRelease('left', () => {
        bean.stop()
        bean.frame = 0
        walkInterval = undefined
    })


    //Trace only Y axis
    bean.onUpdate(() => {
        let newX = game.camPos().x
        let newY = game.camPos().y

        //get new X
        if (bean.pos.x > game.width() * .66) {
            newX = (game.camPos().x + bean.pos.x) / 2
        }

        //get newY
        if (bean.pos.y < game.height() * .75) {
            if (bean.pos.y !== game.camPos().y) {
                newY = (game.camPos().y + bean.pos.y) / 2
            }
            game.camPos().y = 320
        }

        game.camPos(newX, newY)
    })

    game.onUpdate("truck", (_truck) => {
        let truck = _truck as GameObj<AreaComp | BodyComp | RectComp | PosComp>
        truck.move(-50, 0)
        if (truck.pos.y > game.height() + 200) {
            console.log(truck.pos.x, truck.pos.y, game.height())
            truck.destroy();
        }
    })

    //Bucket
    let bucketTimeoutMap: { [key: number]: number } = {}
    game.onDestroy("bucket", (_bucket) => {
        let bucket = _bucket as GameObj<AreaComp | BodyComp | RectComp | PosComp>
        bucket.destroy()
        if (bucket.id && bucketTimeoutMap[bucket.id]) {
            clearInterval(bucketTimeoutMap[bucket.id])
            delete bucketTimeoutMap[bucket.id]
        }
    })
    game.onUpdate("bucket", (_bucket) => {
        let bucket = _bucket as GameObj<AreaComp | BodyComp | RectComp | PosComp>
        if (bucket.id && !bucketTimeoutMap[bucket.id]) {
            bucketTimeoutMap[bucket.id] = setInterval(() => {
                game.add([
                    game.sprite('truck', { width: 30, height: 30, anim: 'left', animSpeed: 2 }),
                    game.pos(bucket.pos.x - 2, bucket.pos.y),
                    game.area({ scale: 0.75, collisionIgnore: ["bucket"] }),
                    game.body({ mass: 10 }),
                    "truck"
                ])
            }, 3000)
        }
    })

    bean.onCollide("truck", truck => {
        console.log("Collided with truck!")
        //Ignore collisions with truck for 1 second
        bean.collisionIgnore = ["truck"]
        setTimeout(() => {
            bean.collisionIgnore = [""]
        }, 1000);

        //Jump and move back to simulate an "ouch"
        // bean.jump(800)

        setTimeout(() => {
            bean.move(-8000, -20000)
        }, 100)
    })

    bean.onCollide("power-up", powerUp => {
        updateScore('power-up')
        powerUp.destroy();
    })


    // game.onKeyRelease('right', () => {
    //     if (currentBeanInterval) {
    //         console.log("Clearing interval!")
    //         clearInterval(currentBeanInterval)
    //     }
    // })
    // game.isKeyDown('space')
}
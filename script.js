// game!

// canvas setup
const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

// images
const imgPaths = {
    bee: "img/game/bee.png",

    cloud_campus: "img/game/cloud_campus.png",
    phase1ground: "img/game/phase1ground.png",

    sunflower: "img/game/sunflower.png",

    ufo_on: "img/game/ufo_on.png",
    ufo_off: "img/game/ufo_off.png",
    ufo_projectile: "img/game/ufo_projectile.png",
    ufo_projectile_large: "img/game/ufo_projectile_large.png",

    cloud1: "img/game/cloud1.png",
    cloud2: "img/game/cloud2.png",
    cloud3: "img/game/cloud3.png",
}
const img = {}
var loadedImages = 0;
var imagesAmt = Object.values(imgPaths).length

for (let name in imgPaths) {
    let path = imgPaths[name]

    let imgElem = new Image()
    imgElem.src = `${path}`
    imgElem.onload = () => {
        img[name] = imgElem
        loadedImages++;
    }
}

// sounds
const soundPaths = {
    coin_ping: "sound/game/coin_ping.mp3",
    hurt: "sound/game/hurt.mp3",
    win: "sound/game/win.mp3",
    select: "sound/game/select.mp3",
}
const sound = {}

var loadedSounds = 0;
var soundsAmt = Object.values(soundPaths).length
for (let name in soundPaths) {
    let path = soundPaths[name]

    let audioElem = new Audio(path)
    audioElem.addEventListener("canplaythrough", () => {
        sound[name] = audioElem
        loadedSounds++
    }, { once: true });
}

function playSound(name) {
    if (sound[name]) {
        sound[name].play()
        return true
    }
    return false
}

// helper variables
var width = canvas.width
var height = canvas.height

var centerx = width / 2
var centery = height / 2

// helper functions
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resizeCanvas() {
    // update helper vars 
    width = canvas.width = canvas.clientWidth;
    height = canvas.height = canvas.clientHeight;
    centerx = width / 2;
    centery = height / 2;

    // re-apply config 
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;

    // modify player 
    player.size = width / 5;
    player.speed = player.size / 5;
}

// player physical position on canvas
let score = 0;
let player = {
    x: 0,
    lastMove: 0,
    size: 0,
    speed: 0,
    speedMult: 1,
}

// offset of environment to create the scrolling effect
let camera = {
    y: 0,
    speed: 1,
}

// dynamic projectiles, collectables, cloud campus, etc
let dynamicEnvironment = [

]

// helper functions for adding to the environment
function createUFO(x, y, speed, size = random(width / 3, width / 3.5), canFireProjectiles = false) {
    dynamicEnvironment.push({
        type: "ufo",
        speed: speed,
        pos: [x, y],
        size: size,
        canFireProjectiles: canFireProjectiles,
        lastSpawnedProjectile: Date.now(),
    })
}
function createFlower(x, y, size = random(width / 8, width / 10)) {
    dynamicEnvironment.push({
        type: "flower",
        pos: [x, y],
        size: size,

        offsetY: 0,
        curOffsetDir: "up",
    })
}
function createProjectile(x, y, speed, dx = 0, dy = 1, size = width / 20) {
    dynamicEnvironment.push({
        type: "projectile",
        speed: speed,
        pos: [x, y],
        dir: [dx, dy],

        size: size,
        sizeChangeDir: "up",
        offsetSize: 0,
    })
}
function createCloud(x, y, imgNum = random(1, 3), size = random(width / 5, width / 8), opacity = random(0.5, 0.7)) {
    dynamicEnvironment.push({
        type: "cloud",
        image: img[`cloud${imgNum}`],
        pos: [x, y],
        opacity: opacity,
        size: size,
    })
}

// helper functions for gameplay
function resetGame() {
    player.x = 0;
    camera.y = 0;
    camera.speed = 1;
    dynamicEnvironment = [

    ]

    lastSpawned = {
        clouds: 0,
        flowers: 0,
        ufos: 0,
    }
    gameOver = false
    gameWin = false
    score = 0;
    sectionNum = 0;
    player.speedMult = 1;
}
function isRectOverlapping(
    Rect1LeftX, Rect1LeftY, Rect1RightX, Rect1RightY,
    Rect2LeftX, Rect2LeftY, Rect2RightX, Rect2RightY
) {
    // r1/r2 is completely to the left of r2/r1
    if (Rect1RightX <= Rect2LeftX || Rect2RightX <= Rect1LeftX) {
        return false;
    }

    // r1/r2 is completely to the bottom of r2/r1
    if (Rect1RightY <= Rect2LeftY || Rect2RightY <= Rect1LeftY) {
        return false;
    }

    return true;
}

// key detection
let keys = {}
document.addEventListener("keydown", (e) => {
    let key = e.code
    keys[key] = true
})
document.addEventListener("keyup", (e) => {
    let key = e.code
    keys[key] = false
})

// mouse detection
let mouse = { x: 0, y: 0 }
canvas.addEventListener("mousedown", () => {
    mouse.down = true
})
canvas.addEventListener("mouseup", () => {
    mouse.down = false
})
document.addEventListener("mousemove", (e) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});

// swipe detection
let swipe = { diffX: 0, diffY: 0 }
/*
down, diffX, diffY
*/

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

    swipe.down = true;
    swipe.diffX = 0;
    swipe.diffY = 0;
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    // swipe delta
    swipe.diffX = (currentX - touchStartX)
    swipe.diffY = (currentY - touchStartY)

    touchStartX = currentX;
    touchStartY = currentY
}, { passive: false });

canvas.addEventListener("touchend", () => {
    swipe.down = false;
    swipe.diffX = 0;
    swipe.diffY = 0;
});

let lastSpawned = {

}
let gameOver = false;
let gameWin = false;
let hasStarted = false;

let sectionNum = 0;

let skyColor = "#0096FF"

resetGame();

// game loop
function tick() {
    let now = Date.now()

    player.y = height - (player.size + 10)

    // clear
    ctx.clearRect(0, 0, width, height);

    // loading checks
    let hasLoadedImages = (loadedImages >= imagesAmt)
    let hasLoadedSounds = (loadedSounds >= soundsAmt)
    if (!hasLoadedImages) {
        ctx.fillStyle = `#000`;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = `#fff`
        ctx.font = "30px Monospace"
        ctx.fillText("Loading assets", 0, 30)
        requestAnimationFrame(tick); return
    }
    if (gameOver) {
        // background
        ctx.fillStyle = `#000`;
        ctx.fillRect(0, 0, width, height);

        // Game Over!
        ctx.fillStyle = `#df0000`
        ctx.font = "30px Monospace"
        let gameOverText = `Game over!`
        let gameOverTextWidth = ctx.measureText(gameOverText).width
        let gameOverTextHeight = 30

        ctx.fillText(gameOverText, centerx - gameOverTextWidth / 2, centery - gameOverTextHeight / 2)

        // Final Score: ${score}
        ctx.fillStyle = `#ccc`
        ctx.font = "20px Monospace"
        let gameOverScoreText = `Final Score: ${score}`
        let gameOverScoreTextWidth = ctx.measureText(gameOverScoreText).width
        let gameOverScoreTextHeight = 20

        ctx.fillText(gameOverScoreText, centerx - gameOverScoreTextWidth / 2, centery - gameOverScoreTextHeight / 2 + 20)

        // [click to continue]
        ctx.fillStyle = `#ccc`
        ctx.font = "20px Monospace"
        let gameOverControlsText = `[click to continue]`
        let gameOverControlsTextWidth = ctx.measureText(gameOverControlsText).width
        let gameOverControlsTextHeight = 20

        ctx.fillText(gameOverControlsText, centerx - gameOverControlsTextWidth / 2, centery - gameOverControlsTextHeight / 2 + 80)

        // actions
        if (mouse.down || swipe.down) {
            playSound("select")
            resetGame()
        }

        requestAnimationFrame(tick); return
    }
    if (gameWin) {
        // background
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, width, height);

        // render cloud campus
        let cloudCampusSize = width
        ctx.drawImage(img.cloud_campus, 0, 20, 40, 40, 0, 100, cloudCampusSize, cloudCampusSize)

        // render player
        ctx.drawImage(img.bee, 3, 4, 19, 19, width / 3.5, 130, player.size, player.size)

        // Game Won!
        ctx.fillStyle = `#00df00`
        ctx.font = "30px Monospace"
        let gameWonText = `Game won!`
        let gameWonTextWidth = ctx.measureText(gameWonText).width
        let gameWonTextHeight = 30

        ctx.fillText(gameWonText, centerx - gameWonTextWidth / 2, centery - gameWonTextHeight / 2)

        // Final Score: ${score}
        ctx.fillStyle = `#3322aa`
        ctx.font = "20px Monospace"
        let gameOverScoreText = `Final Score: ${score}`
        let gameOverScoreTextWidth = ctx.measureText(gameOverScoreText).width
        let gameOverScoreTextHeight = 20

        ctx.fillText(gameOverScoreText, centerx - gameOverScoreTextWidth / 2, centery - gameOverScoreTextHeight / 2 + 20)

        // [click to continue]
        ctx.fillStyle = `#ccc`
        ctx.font = "20px Monospace"
        let gameOverControlsText = `[click to continue]`
        let gameOverControlsTextWidth = ctx.measureText(gameOverControlsText).width
        let gameOverControlsTextHeight = 20

        ctx.fillText(gameOverControlsText, centerx - gameOverControlsTextWidth / 2, centery - gameOverControlsTextHeight / 2 + 80)

        // actions
        if (mouse.down || swipe.down) {
            playSound("select")
            resetGame()
        }

        requestAnimationFrame(tick); return
    }
    if (!hasStarted) {
        // background
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        // [click to continue]
        ctx.fillStyle = `#ccc`
        ctx.font = "20px Monospace"
        let startControlsText = `[click to play]`
        let startControlsTextWidth = ctx.measureText(startControlsText).width
        let startControlsTextHeight = 20

        ctx.fillText(startControlsText, centerx - startControlsTextWidth / 2, centery - startControlsTextHeight / 2)

        if (mouse.down || swipe.down) {
            playSound("select")
            resetGame()
            hasStarted = true;
        }

        requestAnimationFrame(tick); return
    }

    // sections
    if (camera.y >= height * 7.5) {
        // the end
        sectionNum = 7;
        gameWin = true;
        playSound("win")
    }
    if (camera.y >= height * 6.5) {
        // the end (basically)
        sectionNum = 6;
    }
    else if (camera.y >= height * 6) {
        // filler
        sectionNum = 5;
        camera.speed = 2;
        player.speedMult = 2
    } else if (camera.y >= height * 5) {
        // stronger UFO's
        sectionNum = 3;
        camera.speed = 1.75;
        player.speedMult = 1.75
    } else if (camera.y >= height * 2) {
        // UFO's
        sectionNum = 2;
        camera.speed = 1.60;
        player.speedMult = 1.60
    } else if (camera.y >= height) {
        // past the ground
        sectionNum = 1;
        camera.speed = 1.25;
        player.speedMult = 1.25
    } else if (camera.y >= 0) {
        // start
        sectionNum = 0;
        camera.speed = 1;
        player.speedMult = 1;
    }

    // player movement
    if (player.lastMove + 100 < now) {
        let swipeThreshold = 15;
        if (keys.ArrowLeft || keys.KeyA || keys.KeyJ || swipe.diffX < -swipeThreshold) {
            // move left
            player.x -= (player.speed * player.speedMult)

            player.lastMove = now
        }
        if (keys.ArrowRight || keys.KeyD || keys.KeyL || swipe.diffX > swipeThreshold) {
            // move right
            player.x += (player.speed * player.speedMult)

            player.lastMove = now
        }
    }
    camera.y += camera.speed

    player.x = Math.min(Math.max(0, player.x), width - player.size)

    // background (solid color for now)
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, width, height);

    // environment
    for (let objectNum = dynamicEnvironment.length - 1; objectNum >= 0; objectNum--) {
        let object = dynamicEnvironment[objectNum]
        let { type, speed, pos, dir, image, size, opacity, lastSpawnedProjectile, canFireProjectiles, offsetY, curOffsetDir, sizeChangeDir } = object
        let [x, y] = pos ?? []
        let [dx, dy] = dir ?? []

        y += camera.y
        let ogY = y - camera.y

        // remove when it's not in frame or past the win zone
        if (y > height || ogY < -(height * 7)) {
            dynamicEnvironment.splice(objectNum, 1)
            continue
        }

        /*
        y: 606.25
        ogY: -5179.3499999998685
        height: 771
        height*7.5: 5782.5
        camera.y: 5785.5999999998685

        */

        let hasCollision = isRectOverlapping(
            player.x, player.y + (player.size / 3), player.x + player.size, player.y + player.size,
            x, y, x + size, y + size
        )

        let hasCollisionWithMouse = isRectOverlapping(
            mouse.x, mouse.y, mouse.x + 10, mouse.y + 10,
            x, y, x + size, y + size
        )

        /*if (hasCollisionWithMouse) {
            console.clear();
            console.log(y, ogY, height, height * 7.5, camera.y)
        }*/

        // logic for each type
        switch (type) {
            case "ufo":
                if (hasCollision) {
                    playSound("hurt")

                    gameOver = true
                }

                // fire!
                if (canFireProjectiles) {
                    let projectileCooldown = 1000
                    if (lastSpawnedProjectile + projectileCooldown < now) {
                        createProjectile(x + size / 2, ogY + size / 2 + 10, 1)
                        createProjectile(x, y - 10, 1)
                        object.lastSpawnedProjectile = now;
                    }
                }

                let ufoImg = canFireProjectiles ? img.ufo_on : img.ufo_off

                ctx.drawImage(ufoImg, 4, 5, 17, 15, x, y, size, size)

                break
            case "flower":
                if (curOffsetDir == "up") {
                    object.offsetY += 0.2;
                    if (object.offsetY > 5) {
                        object.curOffsetDir = "down"
                    }
                }
                if (curOffsetDir == "down") {
                    object.offsetY -= 0.2;
                    if (object.offsetY < -5) {
                        object.curOffsetDir = "up"
                    }
                }

                if (hasCollision) {
                    playSound("coin_ping")

                    dynamicEnvironment.splice(objectNum, 1)
                    switch (sectionNum) {
                        case (0):
                            score += random(1, 1)
                            break
                        case (1):
                            score += random(1, 2)
                            break
                        case (2):
                            score += random(1, 3)
                            break
                        case (3):
                            score += random(2, 3)
                            break
                        case (4):
                            score += random(3, 5)
                            break
                    }

                    continue
                }
                ctx.drawImage(img.sunflower, x, y + object.offsetY, size, size)
                break
            case "projectile":
                if (hasCollision) {
                    playSound("hurt")

                    gameOver = true
                }

                if (object.sizeChangeDir === "up") {
                    object.offsetSize += 0.5;
                    if (object.offsetSize > 5) {
                        object.sizeChangeDir = "down"
                    }
                }
                if (object.sizeChangeDir === "down") {
                    object.offsetSize -= 0.5;

                    if (object.offsetSize <= 0) {
                        object.sizeChangeDir = "up"
                    }
                }

                object.pos[0] += (dx ?? 0) * speed
                object.pos[1] += (dy ?? 0) * speed

                let renderSize = size + object.offsetSize

                ctx.drawImage(img.ufo_projectile_large, x - renderSize / 2, y - renderSize / 2, renderSize, renderSize)
                break
            case "cloud":
                ctx.globalAlpha = opacity;
                ctx.drawImage(image, x, y, size, size)
                ctx.globalAlpha = 1;
                break
        }
    }

    if (sectionNum === 0) {
        let phase1groundSize = width
        ctx.drawImage(img.phase1ground, 0, height - phase1groundSize + camera.y, width, width)
    }

    if (sectionNum === 0 || true) {
        let phase1groundSize = width
        ctx.drawImage(img.cloud_campus, 0, 20, 40, 40, 0, 0 - height * 7 + camera.y, width, width)
    }

    if (lastSpawned.clouds + 5000 < now) {
        for (let c = 0; c <= random(5, 8); c++) {
            createCloud(random(-50, width), random(0, height) - (height + camera.y + 50));
        }
        lastSpawned.clouds = now
    }

    if (lastSpawned.flowers + 8000 < now) {
        for (let f = 0; f <= random(1, 2); f++) {
            createFlower(random(50, width - 100), random(0, height) - (height + camera.y + 50));
        }
        lastSpawned.flowers = now
    }

    if (lastSpawned.ufos + 5000 < now) {
        if (sectionNum >= 3) {
            for (let u = 0; u <= random(1, 3); u++) {
                let ufoSize = random(width / 5, width / 4.5);
                createUFO(
                    random(Math.min(0, player.x - 30), Math.max(width - ufoSize, player.x + 30)),
                    random(0, height) - (height + camera.y + 50) - (u * height), 1,
                    undefined, true)
            }
        } if (sectionNum >= 2) {
            for (let u = 0; u <= random(1, 2); u++) {
                let ufoSize = random(width / 6, width / 6.25);
                createUFO(
                    random(Math.min(0, player.x - 30), Math.max(width - ufoSize, player.x + 30)),
                    random(0, height) - (height + camera.y + 50) - (u * height), 1,
                    undefined, false)
            }
        }
        lastSpawned.ufos = now
    }

    // render player
    ctx.drawImage(img.bee, 3, 4, 19, 19, player.x, player.y, player.size, player.size)

    // render UI
    let scoreTxt = `Score: ${score}`
    ctx.fillStyle = `#fff`
    ctx.font = "30px Monospace"

    let scoreLen = ctx.measureText(scoreTxt).width;
    ctx.fillText(scoreTxt, centerx - (scoreLen / 2), 30)

    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// dynamic resizing
window.addEventListener("resize", () => { resizeCanvas() }); resizeCanvas();























// html interaction

// navbar
const navbar = document.querySelector(".navbar")
if (navbar) {
    const navbarShortcuts = navbar.getElementsByClassName("navbarShortcut")
    for (let shortcutElement of navbarShortcuts) {
        let data = shortcutElement.dataset
        let { toid } = data
        let toElement = document.getElementById(toid)

        shortcutElement.addEventListener("click", () => {
            if (toElement) {
                toElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }

        })
    }
}

// links
const playGameLinkInSection = document.getElementById("playGameLinkInSection")
playGameLinkInSection.addEventListener("click", () => {
    if (canvas) {
        canvas.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
})
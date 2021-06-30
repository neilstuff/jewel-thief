/** 
 * Jewel Thief 
 * 
 * Electron 
 * 
 */
require('electron-disable-file-drop');

var os = require('os');
var fs = require('fs');

const tileSize = 38;
const originX = 192;
const originY = 192;
const gridSize = tileSize;

const WALK = 0;
const SAIL = 1;

const FIELD = 1;
const SNAG = 3;
const BOAT = 10;
const AXE = 11;
const KEY = 12;
const PLAYER = 13;
const DIAMOND = 14;
const GATE = 15;
const WATER = 22;

const LEFT = 1;
const UP = 2;
const RIGHT = 3;
const DOWN = 4;

const ORIGIN_OFFSET = 6;

var map = [];
var mapSprites = [];
var playerSprites = [];
var itemSprites = [];
var diamondSprites = [];

var diamonds = [];

var start = null;
var direction = 0;
var switchMap = -1;

var debug = false;
var backgroundMusicPlaying = false;

var tilePos = {
    x: 0,
    y: 0
};

var spritePos = {
    x: originX + ORIGIN_OFFSET,
    y: originY,
    gridX: 15,
    gridY: 15
}

var playerContext = {
    motion: 0,
    lastTime: 0,
    timer: -1,
    disposition: WALK,
    axe: false,
    key: false,
    diamonds: 0,
    completed: false
};

var objects = [];
var sounds = [];

setup();

$('#completed-dialog-close').on('click', (event) => {

    $('#completed-dialog').css('display', 'none');
    var context = $('#canvas')[0].getContext('2d');

    setup();
    reset();
    waterFill(context);
    landFill(context);

});


$('#cancelSafe').on('click', (e) => {

    app.quit();

});

/**
 * Respond to the Document 'ready' event
 * 
 */
 $(() => {
    var context = $('#canvas')[0].getContext('2d');

    createSpriteBuffer(0, mapSprites, 'testtileset', Tile.BLOCKED, 32, 32, 32, 32, 32, 32);
    createSpriteBuffer(1, mapSprites, 'testtileset', Tile.BLOCKED, 0, 32, 32, 32, 32, 32);
    createSpriteBuffer(2, mapSprites, 'testtileset', Tile.BLOCKED, 64, 32, 32, 32, 32, 32);
    createSpriteBuffer(3, mapSprites, 'testtileset', Tile.WALK, 64, 0, 32, 32, 32, 32);
    createSpriteBuffer(4, mapSprites, 'testtileset', Tile.WALK, 96, 0, 32, 32, 32, 32);
    createSpriteBuffer(5, mapSprites, 'testtileset', Tile.SAIL, 128, 0, 32, 32, 32, 32);
    createSpriteBuffer(6, mapSprites, 'testtileset', Tile.WALK, 0, 0, 32, 32, 32, 32);
    createSpriteBuffer(7, mapSprites, 'testtileset', Tile.BLOCKED, 96, 32, 32, 32, 32, 32);
    createSpriteBuffer(8, mapSprites, 'testtileset', Tile.WALK, 128, 32, 32, 32, 32, 32);

    var pos = 0;
    for (var iSprite = 0; iSprite < 4; iSprite++) {
        createSpriteBuffer(pos++, playerSprites, 'playersprites', Tile.WALKING, 0, 24 * iSprite, 24, 24, 24, 24);
        createSpriteBuffer(pos++, playerSprites, 'playersprites', Tile.WALKING, 24, 24 * iSprite, 24, 24, 24, 24);
    }

    for (var iSprite = 4; iSprite < 10; iSprite++) {
        createSpriteBuffer(pos++, playerSprites, 'playersprites', Tile.SAILING, 0, 24 * iSprite, 24, 24, 24, 24);
        createSpriteBuffer(pos++, playerSprites, 'playersprites', Tile.SAILING, 24, 24 * iSprite, 24, 24, 24, 24);
    }

    createSpriteBuffer(0, itemSprites, 'items', Tile.BOAT, 0, 24, 24, 24, 24, 24);
    createSpriteBuffer(1, itemSprites, 'items', Tile.AXE, 24, 24, 24, 24, 24, 24);
    createSpriteBuffer(2, itemSprites, 'items', Tile.KEY, 48, 24, 24, 24, 24, 24);

    for (var iSprite = 0; iSprite < 4; iSprite++) {
        createSpriteBuffer(iSprite, diamondSprites, 'diamond', Tile.DIAMOND, iSprite * 16, 0, 16, 16, 16, 16);
    }

    sounds[0] = createAudio('bgmusic');
    sounds[0].loop = true;

    sounds[1] = createAudio('collect');
    sounds[2] = createAudio('splash');
    sounds[3] = createAudio('mapmove');
    sounds[4] = createAudio('menuoption');
    sounds[5] = createAudio('finish');
    sounds[6] = createAudio('chop');

    sounds[5].volume = 0.2;
    sounds[5].play();

    reset();

    var image = new Image();
    image.src = $('#logo')[0].src;
    image.onload = function() {

        context.drawImage(image, 0, 0, this.width, this.height, 0, 20, 384, 384);
        $(".controls").html("&nbsp;Time: 100 - (" + (tilePos.x + 5) + "," + (tilePos.y + 5) + ")");
        window.requestAnimationFrame(gameTicker);

    }

    window.addEventListener('keydown', doKeyDown, true);
    window.addEventListener('keyup', doKeyUp, true);

});

/**
 * Setup the Map
 * 
 */
function setup() {
    var content = $('script[data-template="basic-map"]').text();

    loadMap(content, (map) => {

        this.map = map;

    });
}

/**
 * Reset the Game
 * 
 */
function reset() {

    $(".axe").css({ opacity: 0.3 });
    $(".key").css({ opacity: 0.3 });

    $(".diamond1").css({ opacity: 0.3 });
    $(".diamond2").css({ opacity: 0.3 });
    $(".diamond3").css({ opacity: 0.3 });

    playerContext.disposition = WALK;
    playerContext.axe = false;
    playerContext.key = false;
    playerContext.diamonds = 0;
    playerContext.timer = -1;
    playerContext.completed = false;

    for (var x = 0; x < 39; x++) {
        for (var y = 0; y < 39; y++) {
            var sprite = map[x][y];

            if (sprite == PLAYER) {

                tilePos.x = x - 5;
                tilePos.y = y - 5;

            }

        }

    }

}

/**
 * Create an off-screen buffer containg an image
 * 
 * @param {*} sprite the Sprite Index
 * @param {*} sprites the Sprite Array
 * @param {*} src the Tile Map
 * @param {*} type the Type of Tile
 * @param {*} x the x coordinate - within the sprite map
 * @param {*} y the y coordinate - within the sprite map
 * @param {*} w the sprite width
 * @param {*} h the sprite height
 * @param {*} dw the destination width
 * @param {*} dh the destination height
 */
function createSpriteBuffer(sprite, sprites, src, type, x, y, w, h, dw, dh) {
    var canvas = document.createElement('canvas');

    canvas.width = dw;
    canvas.height = dh;

    var content = fs.readFileSync($(`#${src}`)[0].src.slice(os.type() == 'Windows_NT' ? 7 : 6));
    var buffer = toArrayBuffer(content);
    var blob = new Blob([buffer], { type: 'image/gif' });
    var image = new Image();
    image.src = URL.createObjectURL(blob);

    image.onload = function() {
        var context = canvas.getContext('2d');

        context.drawImage(image, x, y, w, h, 0, 0, dw, dh);

        sprites[sprite] = new Tile(canvas, type);

    }

}

/**
 * Create Audio URL
 * 
 * @param {*} src the Audio Source

 */
function createAudio(src) {
    var content = fs.readFileSync($(`#${src}`)[0].src.slice(7));
    var buffer = toArrayBuffer(content);
    var blob = new Blob([buffer], { type: 'audio/wav' });

    return new Audio(URL.createObjectURL(blob))

}

/**
 * The Game Loop
 * 
 * @param {*} timestamp 
 */
function gameTicker(timestamp) {

    start = (!start) ? timestamp : start;

    if (playerContext.lastTime == 0) playerContext.lastTime = timestamp;

    var progress = timestamp - start;

    if (progress > 3000) {

        if (playerContext.timer == -1) {
            playerContext.timer = timestamp;
        }

        if (!playerContext.completed) {
            var timer = Math.floor((timestamp - playerContext.timer) / 1000);
            $(".controls").html("&nbsp;Timer: " + timer);
        }

        $(".axe").attr('src', itemSprites[1].getImage().toDataURL());
        $(".key").attr('src', itemSprites[2].getImage().toDataURL());
        $(".diamond1").attr('src', diamondSprites[0].getImage().toDataURL());
        $(".diamond2").attr('src', diamondSprites[0].getImage().toDataURL());
        $(".diamond3").attr('src', diamondSprites[0].getImage().toDataURL());

        if (!playerContext.completed && !backgroundMusicPlaying) {
            sounds[0].volume = 0.2;
            sounds[0].play();
            backgroundMusicPlaying = true;
        }

        $('#controls').css('display', 'block');

        var ctx = $('#canvas')[0].getContext('2d');

        switch (Math.abs(direction)) {

            case LEFT:
                getTile(spritePos.x - 2, spritePos.y, function(xGrid, yGrid, tile, sprite) {

                    if (spritePos.x - 1 < 0) {

                        if (tilePos.x <= 4) {
                            tilePos.x = 0;
                            spritePos.x += 32 * ((spritePos.x - 2) + 8);
                        } else {
                            spritePos.x = originX;
                            tilePos.x -= 5;
                        }
                    } else {
                        spritePos.x -= 1;

                    }

                });

                break;
            case UP:
                getTile(spritePos.x, spritePos.y - 2, function(xGrid, yGrid, tile, sprite) {
                    if (spritePos.y - 1 < 0) {
                        if (tilePos.y <= 4) {
                            tilePos.y = 0;
                            spritePos.y += 32 * 3;
                        } else {
                            spritePos.y = originY;
                            tilePos.y -= 5;
                        }
                    } else {
                        spritePos.y -= 1;
                    }

                });
                break;
            case RIGHT:
                getTile(spritePos.x + tileSize - 4, spritePos.y, function(xGrid, yGrid, tile, sprite) {
                    if (spritePos.x + 1 > 340) {
                        if (tilePos.x >= 27) {
                            tilePos.x = 30;
                            spritePos.x -= 32 * 3;
                        } else {
                            spritePos.x = originX;
                            tilePos.x += 4;
                        }
                    } else {
                        spritePos.x += 1;
                    }

                });
                break;

            case DOWN:
                getTile(spritePos.x, spritePos.y + tileSize - 4, function(xGrid, yGrid, tile, sprite) {
                    if (spritePos.y + 1 > 340) {
                        if (tilePos.y >= 27) {
                            tilePos.y = 30;
                            spritePos.y -= 32 * 3;
                        } else {
                            spritePos.y = originY;
                            tilePos.y += 4;
                        }
                    } else {
                        spritePos.y += 1;
                    }

                });
                break;

        }

        if (timestamp - playerContext.lastTime > 400) {
            if (playerContext.disposition == WALK) {
                switch (direction) {
                    case LEFT:
                        playerContext.motion = (playerContext.motion == 3) ? 2 : 3;
                        break;
                    case RIGHT:
                        playerContext.motion = (playerContext.motion == 5) ? 4 : 5;
                        break;
                    case UP:
                        playerContext.motion = (playerContext.motion == 7) ? 6 : 7;
                        break;
                    case DOWN:
                        playerContext.motion = (playerContext.motion == 1) ? 0 : 1;
                        break;
                    default:
                        break;
                }
            } else {
                switch (direction) {
                    case DOWN:
                        playerContext.motion = (playerContext.motion == 9) ? 8 : 9;
                        break;
                    case RIGHT:
                        playerContext.motion = (playerContext.motion == 13) ? 12 : 13;
                        break;
                    case LEFT:
                        playerContext.motion = (playerContext.motion == 11) ? 10 : 11;
                        break;
                    case UP:
                        playerContext.motion = (playerContext.motion == 15) ? 14 : 15;
                        break;
                }

            }

            playerContext.lastTime = timestamp;

        }

        if (direction < 0) {
            direction = 0;
        }

        ctx.fillStyle = '#a6e26b';
        ctx.fillRect(0, 0, 384, 384);

        waterFill(ctx);
        landFill(ctx);

        ctx.drawImage(playerSprites[playerContext.motion].getImage(), spritePos.x, spritePos.y);
        window.requestAnimationFrame(gameTicker);

    } else {
        window.requestAnimationFrame(gameTicker);
    }

}

/**
 * Get the Tile at the Offset 
 * 
 * @param {*} x The current 'x' player coordinate
 * @param {*} y The current 'y' player coordinate
 */
function getTile(x, y, callback) {
    var xGrid = Math.trunc(x / gridSize);
    var yGrid = Math.trunc(y / gridSize);
    var gridPos = {
        x: xGrid + tilePos.x,
        y: yGrid + tilePos.y
    }

    var sprite = map[xGrid + tilePos.x][yGrid + tilePos.y];
    var tile = mapSprites[translate(map[xGrid + tilePos.x][yGrid + tilePos.y])];

    if ((tile.getType() == Tile.WALK && playerContext.disposition == WALK) ||
        (playerContext.disposition == WALK && sprite == BOAT) ||
        (playerContext.disposition == WALK && sprite == GATE && playerContext.key) ||
        (tile.getType() == Tile.SAIL && playerContext.disposition == SAIL) ||
        (tile.getType() == Tile.WALK && playerContext.disposition == SAIL) ||
        (playerContext.axe && sprite == 3)) {

        callback(xGrid + tilePos.x, yGrid + tilePos.y, tile, sprite);

        if (sprite == BOAT) {
            spritePos.x = ((xGrid) * tileSize + 8);
            spritePos.y = ((yGrid) * tileSize + 8);
            map[xGrid + tilePos.x][yGrid + tilePos.y] = 22;
            playerContext.disposition = SAIL;
            playerContext.motion = (playerContext.motion == 2 || playerContext.motion == 3) ? 10 : 12;
            sounds[2].play();
        }

        if (sprite == AXE && !playerContext.axe) {
            map[xGrid + tilePos.x][yGrid + tilePos.y] = FIELD;
            playerContext.axe = true;
            sounds[1].play();
            $(".axe").css('opacity', '1.0');
        }

        if (sprite == DIAMOND) {
            map[xGrid + tilePos.x][yGrid + tilePos.y] = FIELD;
            sounds[1].play();
            playerContext.diamonds = playerContext.diamonds == 3 ? 3 : playerContext.diamonds + 1;
            $(".diamond" + playerContext.diamonds).css('opacity', '1.0');
        }

        if (sprite == KEY && !playerContext.key) {
            map[xGrid + tilePos.x][yGrid + tilePos.y] = FIELD;
            playerContext.key = true;
            sounds[1].play();
            $(".key").css('opacity', '1.0');
        }

        if (sprite == GATE && playerContext.key) {
            sounds[0].pause();
            sounds[0].currentTime = 0;
            playerContext.completed = true;
            sounds[5].play();
            $("#completed-dialog").css('display', 'inline-block');
        }

        if ((tile.getType() == Tile.WALK || sprite == SNAG && playerContext.axe) &&
            playerContext.disposition == SAIL) {
            spritePos.x = ((xGrid) * tileSize + 8);
            spritePos.y = ((yGrid) * tileSize + 8);
            playerContext.motion = (playerContext.motion == 10 || playerContext.motion == 11) ? 2 : 4;
            map[spritePos.gridX][spritePos.gridY] = 10;
            sounds[4].play();
            playerContext.disposition = WALK;
        }

        if (playerContext.axe && sprite == SNAG) {
            map[xGrid + tilePos.x][yGrid + tilePos.y] = FIELD;
            sounds[6].play();
            playerContext.disposition == SAIL
        }

        spritePos.gridX = gridPos.x;
        spritePos.gridY = gridPos.y;

    }

}

/**
 * Fill in the Land Tiles
 * 
 * @param {*} ctx the Canvas Context
 */
function landFill(ctx) {
    var iDiamond = 0;

    for (var xMap = 0; xMap < 10; xMap++) {
        for (var yMap = 0; yMap < 10; yMap++) {
            var sprite = map[xMap + (tilePos.x)][yMap + (tilePos.y)];
            var iSprite = translate(sprite);

            ctx.drawImage(mapSprites[iSprite].getImage(), xMap * tileSize + 4, yMap * tileSize + 4);

            if (sprite == BOAT && playerContext.disposition == WALK) {
                ctx.drawImage(itemSprites[0].getImage(), xMap * tileSize + 4, yMap * tileSize + 4);
            } else if (sprite == AXE) {
                ctx.drawImage(itemSprites[1].getImage(), xMap * tileSize + 4, yMap * tileSize + 4);
            } else if (sprite == KEY) {
                ctx.drawImage(itemSprites[2].getImage(), xMap * tileSize + 4, yMap * tileSize + 4);
            } else if (sprite == DIAMOND) {
                if (diamonds.length == iDiamond) {
                    diamonds.push({
                        inc: 1,
                        timer: 0,
                        sprite: 0,
                        delta: 0
                    })
                }

                if (diamonds[iDiamond].timer > 1) {
                    if (diamonds[iDiamond].delta == 0) {
                        diamonds[iDiamond].inc = 1

                    } else if (diamonds[iDiamond].delta > 12) {
                        diamonds[iDiamond].inc = -1

                    }

                    diamonds[iDiamond].delta += diamonds[iDiamond].inc;
                    diamonds[iDiamond].sprite = diamonds[iDiamond].sprite < 3 ? diamonds[iDiamond].sprite + 1 : 0;
                    diamonds[iDiamond].timer = 0;
                } else {
                    diamonds[iDiamond].timer += 1;
                }

                ctx.drawImage(diamondSprites[diamonds[iDiamond].sprite].getImage(), xMap * tileSize + 4, yMap * tileSize + 4 + diamonds[iDiamond].delta);

            }

        }

    }

}

/**
 * Fill in the Water
 * 
 * @param {*} ctx the Canvas Context
 */
function waterFill(ctx) {

    for (var xMap = 0; xMap < 10; xMap++) {
        for (var yMap = 0; yMap < 10; yMap++) {
            var sprite = map[xMap + (tilePos.x)][yMap + (tilePos.y)];

            if (sprite == 22 || sprite == 10) {
                ctx.fillStyle = "#5d96c7";
                ctx.fillRect(xMap * tileSize, yMap * tileSize, 42, 42);
            }

        }

    }

}

/**
 * Translate the sprite from the map
 * 
 * @param {*} sprite to translate
 */
function translate(sprite) {

    return (sprite == 20) ? 1 :
        (sprite == 22 || sprite == 10) ? 5 :
        (sprite == GATE) ? 7 :
        (sprite == SNAG) ? 0 :
        (sprite == 2) ? 4 :
        (sprite == 21) ? 3 : 6;
}

/**
 * Process the Key Down Event
 * @param {*} event The Keyboard Event
 */
function doKeyDown(event) {

    switch (event.keyCode) {
        case 37:
            /* Left arrow was pressed */
            direction = 1;
            break;
        case 38:
            /* Up arrow was pressed */
            direction = 2;
            break;
        case 39:
            /* Right arrow was pressed */
            direction = 3;
            break;
        case 40:
            /* Down arrow was pressed */
            direction = 4;
            break;
    }

}

/**
 * Process the Key Up Event
 * @param {*} event The Keyboard Event
 */
function doKeyUp(event) {

    switch (event.keyCode) {
        case 37:
            /* Left arrow was pressed */
            direction = -1;
            break;
        case 38:
            /* Up arrow was pressed */
            direction = -2;
            break;
        case 39:
            /* Right arrow was pressed */
            direction = -3;
            break;
        case 40:
            /* Down arrow was pressed */
            direction = -4;
            break;
        case 76:
            readFileMap();
            break
        case 82:
            var context = $('#canvas')[0].getContext('2d');
            setup();
            reset();
            waterFill(context);
            landFill(context);
            break;
        case 83:
            sounds[0].volume = (sounds[0].volume == 0.2 ? 0.0 : 0.2);

            break;

    }

}

/**
 * Load and replace the Map from the File
 * 
 */
function readFileMap() {
    var fileutil = new FileUtil(document);
    var _this = this;

    fileutil.load(async function(files) {

        Array.prototype.slice.call(files).forEach((file) => {

            return new Promise((accept, reject) => {
                var reader = new FileReader();

                reader.onload = function() {
                    var text = reader.result;

                    loadMap(text, (map) => {
                        _this.map = map;
                        var context = $('#canvas')[0].getContext('2d');
                        reset();

                        waterFill(context);
                        landFill(context)


                    });
                };

                reader.readAsText(file);

            });


        });

    });

}

/**
 * Load a Map
 * 
 * @param {*} url the URL to load
 * @param {*} callback call this function when completed the load
 */
function loadMap(content, callback) {
    var map = [];

    var lines = content.split(/\r?\n/);
    for (var iLine in lines) {
        map.push(lines[iLine].split(/\s/));
    }

    callback(map);


}

/**
 * Buffer to Array Buffer
 * @param {*} buf the input buffer
 * @return an Array Buffer
 * 
 */
function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }

    return ab;

}
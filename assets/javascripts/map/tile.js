Tile.BLOCKED = 0;

Tile.WALK = 1;
Tile.SAIL = 2;    

Tile.WALKING = 0;
Tile.SAILING = 1; 

Tile.BOAT = 0;
Tile.AXE = 1;
Tile.KEY = 2;
Tile.DIAMOND = 3;
Tile.GATE = 4;

Tile.PLAYER = 0;

function Tile(image, type) {

    this.__image = image;
    this.__type = type;

};

Tile.prototype.getImage = function() {

    return this.__image;

};

Tile.prototype.getType = function() {

    return this.__type;

};
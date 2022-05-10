var
	DOWN			= 1,
	LEFT			= 2,
	UP				= 3,
	NONE			= 4,
	WAITING			= 5,
	PAUSE			= 6,
	PLAYING			= 7,
	COUNTDOWN		= 8,
	EATEN_PAUSE		= 9,
	DYING			= 10,
	RIGHT			= 11,
	Pacman			= {};


//play speed
Pacman.FPS = 600;

// ghosts
Pacman.Ghost = function (game, map, colour, id) {

	var position  = null,
		direction = null,
		eatable   = null,
		eaten	 = null,
		due	   = null;

// New speed after death
	function getNewCoord(dir, current) { 
		var speed  = isVunerable() ? 0.5 : isHidden() ? 3 : 2,
			xSpeed = (dir === LEFT && -speed || dir === RIGHT && speed || 0),
			ySpeed = (dir === DOWN && speed || dir === UP && -speed || 0);
	
		return {
			"x": addBounded(current.x, xSpeed),
			"y": addBounded(current.y, ySpeed)
		};
	};

// when hit the wall	
	function addBounded(x1, x2) { 
		var rem	= x1 % 10, 
			result = rem + x2;
		if (rem !== 0 && result > 10) {
			return x1 + (10 - rem);
		} else if(rem > 0 && result < 0) { 
			return x1 - rem;
		}
		return x1 + x2;
	};
	
	function isVunerable() { 
		return eatable !== null;
	};
	
	function isDangerous() {
		return eaten === null;
	};

	function isHidden() { 
		return eatable === null && eaten !== null;
	};
	
	function getRandomDirection() {
		var moves = (direction === LEFT || direction === RIGHT) 
			? [UP, DOWN] : [LEFT, RIGHT];
		return moves[Math.floor(Math.random() * 2)];
	};

// the coordinates of where they fell again
	function reset() {
		eaten = null;
		eatable = null;
		position = {"x": 90, "y": 80};
		map.setGhost(id, position);
		direction = getRandomDirection();
		due = getRandomDirection();
	};
	
	function onWholeSquare(x) {
		return x % 10 === 0;
	};
	
	function oppositeDirection(dir) { 
		return dir === LEFT && RIGHT ||
			dir === RIGHT && LEFT ||
			dir === UP && DOWN || UP;
	};

	function makeEatable() {
		direction = oppositeDirection(direction);
		eatable = game.getTick();
	};

	function eat() { 
		eatable = null;
		eaten = game.getTick();
	};

	function pointToCoord(x) {
		return Math.round(x / 10);
	};

	function nextSquare(x, dir) {
		var rem = x % 10;
		if (rem === 0) { 
			return x; 
		} else if (dir === RIGHT || dir === DOWN) { 
			return x + (10 - rem);
		} else { 
			return x - rem;
		}
	};

	function onGridSquare(pos) {
		return onWholeSquare(pos.y) && onWholeSquare(pos.x);
	};

	function secondsAgo(tick) { 
		return (game.getTick() - tick) / Pacman.FPS;
	};

	function getColour() { 
		if (eatable) { 
			if (secondsAgo(eatable) > 5) { 
				return game.getTick() % 20 > 10 ? "#FFFFFF" : "#0000BB";
			} else { 
				return "#0000BB";
			}
		} else if(eaten) { 
			return "#222";
		} 
		return colour;
	};

	function draw(ctx) {
  
		var s	= map.blockSize, 
			top  = (position.y/10) * s,
			left = (position.x/10) * s;
	
		if (eatable && secondsAgo(eatable) > 8) {
			eatable = null;
		}
		
		if (eaten && secondsAgo(eaten) > 3) { 
			eaten = null;
		}
		
		var tl = left + s;
		var base = top + s - 3;
		var inc = s / 10;

		var high = game.getTick() % 10 > 5 ? 3  : -3;
		var low  = game.getTick() % 10 > 5 ? -3 : 3;

		ctx.fillStyle = getColour();
		ctx.beginPath();

		ctx.moveTo(left, base);

		ctx.quadraticCurveTo(left, top, left + (s/2),  top);
		ctx.quadraticCurveTo(left + s, top, left+s,  base);
		
		ctx.quadraticCurveTo(tl-(inc*1), base+high, tl - (inc * 2),  base);
		ctx.quadraticCurveTo(tl-(inc*3), base+low, tl - (inc * 4),  base);
		ctx.quadraticCurveTo(tl-(inc*5), base+high, tl - (inc * 6),  base);
		ctx.quadraticCurveTo(tl-(inc*7), base+low, tl - (inc * 8),  base); 
		ctx.quadraticCurveTo(tl-(inc*9), base+high, tl - (inc * 10), base); 

		ctx.closePath();
		ctx.fill();

		ctx.beginPath();
		ctx.fillStyle = "#FFF";
		ctx.arc(left + 6,top + 6, s / 6, 0, 300, false);
		ctx.arc((left + s) - 6,top + 6, s / 6, 0, 300, false);
		ctx.closePath();
		ctx.fill();

		var f = s / 12;
		var off = {};
		off[RIGHT] = [f, 0];
		off[LEFT]  = [-f, 0];
		off[UP]	= [0, -f];
		off[DOWN]  = [0, f];

		ctx.beginPath();
		ctx.fillStyle = "#000";
		ctx.arc(left+6+off[direction][0], top+6+off[direction][1], 
				s / 15, 0, 300, false);
		ctx.arc((left+s)-6+off[direction][0], top+6+off[direction][1], 
				s / 15, 0, 300, false);
		ctx.closePath();
		ctx.fill();

	};

	function pane(pos) {

		if (pos.y === 100 && pos.x >= 190 && direction === RIGHT) {
			return {"y": 100, "x": -10};
		}
		
		if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
			return position = {"y": 100, "x": 190};
		}

		return false;
	};
	
	function move(ctx) {
		var oldPos = position,
			onGrid = onGridSquare(position),
			npos   = null;

		if (due !== direction) {
			
			npos = getNewCoord(due, position);
			
			if (onGrid &&
				map.isFloorSpace({
					"y":pointToCoord(nextSquare(npos.y, due)),
					"x":pointToCoord(nextSquare(npos.x, due))})) {
				direction = due;
			} else {
				npos = null;
			}
		}
		
		if (npos === null) {
			npos = getNewCoord(direction, position);
		}
		
		if (onGrid &&
			map.isWallSpace({
				"y" : pointToCoord(nextSquare(npos.y, direction)),
				"x" : pointToCoord(nextSquare(npos.x, direction))
			})) {
			
			due = getRandomDirection();			
			return move(ctx);
		}

		position = npos;		
		
		var tmp = pane(position);
		if (tmp) { 
			position = tmp;
		}
		
		due = getRandomDirection();
		
		map.setGhost(id, position);

		return {
			"new" : position,
			"old" : oldPos,
			"dir" : direction
		};
	};
	
	return {
		"eat"		 : eat,
		"isVunerable" : isVunerable,
		"isDangerous" : isDangerous,
		"makeEatable" : makeEatable,
		"reset"	   : reset,
		"move"		: move,
		"draw"		: draw
	};
};

// the real player
Pacman.User = function (game, map, ghosts) {
	
	var position  = null,
		direction = null,
		eaten	 = null,
		due	   = null, 
		lives	 = null,
		score	 = 5,
		keyMap	= {};
	
	keyMap[KEY.ARROW_LEFT]  = LEFT;
	keyMap[KEY.ARROW_UP]	= UP;
	keyMap[KEY.ARROW_RIGHT] = RIGHT;
	keyMap[KEY.ARROW_DOWN]  = DOWN;

	function addScore(nScore) { 
		score += nScore;
		if (score >= 10000 && score - nScore < 10000) { 
			lives += 1;
		}
	};

	function theScore() { 
		return score;
	};

	function loseLife() { 
		lives -= 1;
	};

	function getLives() {
		return lives;
	};

	function initUser() {
		score = 0;
		lives = 3;
		newLevel();
	}
	
	function newLevel() {
		resetPosition();
		eaten = 0;
	};
	
	function resetPosition() {
		position = {"x": 90, "y": 120};
		direction = LEFT;
		due = LEFT;
	};
	
	function reset() {
		initUser();
		resetPosition();
	};		
	
	function keyDown(e) {
		if (typeof keyMap[e.keyCode] !== "undefined") { 
			due = keyMap[e.keyCode];
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
		return true;
	};

	function getNewCoord(dir, current) {   
		return {
			"x": current.x + (dir === LEFT && -2 || dir === RIGHT && 2 || 0),
			"y": current.y + (dir === DOWN && 2 || dir === UP	&& -2 || 0)
		};
	};

	function onWholeSquare(x) {
		return x % 10 === 0;
	};

	function pointToCoord(x) {
		return Math.round(x/10);
	};
	
	function nextSquare(x, dir) {
		var rem = x % 10;
		if (rem === 0) { 
			return x; 
		} else if (dir === RIGHT || dir === DOWN) { 
			return x + (10 - rem);
		} else { 
			return x - rem;
		}
	};

	function next(pos, dir) {
		return {
			"y" : pointToCoord(nextSquare(pos.y, dir)),
			"x" : pointToCoord(nextSquare(pos.x, dir)),
		};							   
	};

	function onGridSquare(pos) {
		return onWholeSquare(pos.y) && onWholeSquare(pos.x);
	};

	function isOnSamePlane(due, dir) { 
		return ((due === LEFT || due === RIGHT) && 
				(dir === LEFT || dir === RIGHT)) || 
			((due === UP || due === DOWN) && 
			 (dir === UP || dir === DOWN));
	};

	function getRandomDirection() {
		var moves = (direction === LEFT || direction === RIGHT) 
			? [UP, DOWN] : [LEFT, RIGHT];
		return moves[Math.floor(Math.random() * 2)];
	};

	function collided(user, ghost, zone) {
		return (Math.sqrt(Math.pow(ghost.x - user.x, 2) + 
						  Math.pow(ghost.y - user.y, 2))) < zone;
	};

// Find the nearest path
	function searchNearestPath(upos, ghosts, dir) {
		var directions = [LEFT, RIGHT, UP, DOWN];
		var nearest = {"dist":9999, "food":0, "ghost":null};
		var vis = {};
		var first_dir = dir;
// Preparing the first points in the waiting list, which is the current point
		var pile = [{"pos": upos, "dir": dir, "dist": 0, "food": 0}];

		while (pile.length>0) {
// drag a point from the queue as a start
			var node = pile.shift();
			
			upos = node.pos;
			dir = node.dir;
			dist = node.dist;
			food = node.food;
			
			var keypos = upos.x + " " + upos.y;
			vis[keypos] = 1;
			
			// when he meet a wall hn his road

			if (dir==LEFT) {
				pas = -1;
				start = upos.x-1;
				end = 0;
				path = "h";
				if (start<=end)
					continue
			}
			else if (dir==RIGHT) {
				pas = 1;
				start = upos.x+1;
				end = map.getMap()[0].length;
				path = "h";
				if (start>=end)
					continue
			}
			else if (dir==UP) {
				pas = -1;
				start = upos.y-1;
				end = 0;
				path = "v";
				if (start<=end)
					continue
			}
			else if (dir==DOWN) {
				pas = 1;
				start = upos.y+1;
				end = map.getMap().length;
				path = "v";
				if (start>=end)
					continue
			}

			for (var i=start; (pas<0 && i>end) || (pas>0 && i<end); i+=pas) {
								
				dist += 1;
				nearest.dist = dist;

				var x = i;
				var y = upos.y;
				if (path=="v") {
					x = upos.x;
					y = i;
				}

				var idGhost = map.getGhosts()[y][x];
				if (idGhost>0) {
					// whn he meet agoast
					if (ghosts[idGhost-1].isDangerous())
						nearest.ghost = idGhost-1;
					return nearest;
				}

				
				if (map.getMap()[y][x] == Pacman.PILL) {
					// big point?
					// Eat it and finish the search
					food += 50;
					nearest.food = food;
					return nearest;
				}
				else if (map.getMap()[y][x] == Pacman.BISCUIT) {
					// small dot
					food += 2;
					nearest.food = food;
				}

				
				var nexti = i+pas;
				var wx = nexti;
				var wy = upos.y;
				if (path=="v") { wx = upos.x; wy = nexti; }

				if (nexti==end)
					break;

				if (map.getMap()[wy][wx] == Pacman.WALL) {

					// Look at the new possible directions in front of you
					cdirs = [LEFT, RIGHT];
					if (dir === LEFT || dir === RIGHT)
						cdirs = [UP, DOWN];

					for (var j=0; j<cdirs.length; j++) {
						
						var dir = cdirs[j]
						if ((first_dir==LEFT && dir==RIGHT) || (first_dir==RIGHT && dir==LEFT)
							|| (first_dir==UP && dir==DOWN) || (first_dir==DOWN && dir==UP))
							continue

						var pos = {"y":y, "x":x};
						var keypos = pos.x + " " + pos.y;

						// Don't use the old points you got before
						if (keypos in vis)
							continue;

						if (dist>=10)
							break;
						
						pile.push({"pos": pos, "dir": cdirs[j], "dist": dist, "food": food});
					}

					break;
				}
			}
		}
		return nearest;
	}

// move in the safe direction
	function getSafeDirection(upos, gposs, ghosts) {
		var directions = [LEFT, RIGHT, UP, DOWN];

		var cupos = {
			"y":pointToCoord(upos.y),
			"x":pointToCoord(upos.x)
		}
		
		var ddist = {};
		var dfood = {};
		var dghost = {};

			// 14Consider again the possible directions and count the number of steps of the nearest road that can be found
		for (var i=0; i<directions.length; i++) {
			// Search for the nearest enemy or15 the nearest large point, to take the least number of steps that lead to it				
			var nearest = searchNearestPath(cupos, ghosts, directions[i]);	
			ddist[directions[i]] = nearest.dist;
			dfood[directions[i]] = nearest.food;
			dghost[directions[i]] = 500;
			// If we find an enemy close to this direction, we take the last road, the distance between it and the enemy is less
			if (nearest.ghost != null)
				dghost[directions[i]] = nearest.dist;
		}
		
			// Arrange the directions again to take the route that gives us the most food points
		directions.sort(function(a, b) {
			return dfood[b] - dfood[a];
		});

		var is_danger = 0;
		
		for (var i=0; i<directions.length; i++) {
			if (map.isWallSpace({
				"y" : pointToCoord(nextSquare(upos.y, directions[i])),
				"x" : pointToCoord(nextSquare(upos.x, directions[i]))
			}))
				continue;

				// If this road leads to an enemy, we try to escape from it quickly
			if (dghost[directions[i]] && dghost[directions[i]]<70) {
				is_danger = 1;
				break;
			}
			
			if ((directions[i] === LEFT || directions[i] === RIGHT) && (direction===UP || direction===DOWN)) {
				return directions[i];
			} else if ((directions[i] === UP || directions[i] === DOWN) && (direction===LEFT || direction===RIGHT)) {
				return directions[i];
			}
		}
		
			// Escape from any enemy
		if (is_danger) {
			directions.sort(function(a, b) {
				return ddist[b] - ddist[a];
			});
			
			for (var i=0; i<directions.length; i++) {
			// 17 Choosing the first possible way to get away from enemies
				if ((directions[i] === LEFT || directions[i] === RIGHT) && (direction===UP || direction===DOWN)) {
					return directions[i];
				} else if ((directions[i] === UP || directions[i] === DOWN) && (direction===LEFT || direction===RIGHT)) {
					return directions[i];
				}
			}

		}

			// If it fails to choose directions, we will choose a random direction
		return getRandomDirection();
	}

	function pane(pos) {

		if (pos.y === 100 && pos.x >= 190 && direction === RIGHT) {
			return {"y": 100, "x": -10};
		}
		
		if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
			return position = {"y": 100, "x": 190};
		}

		return false;
	};

	function move(ctx, mode="n", ghostPos=[], ghosts=[]) {
		var npos		= null, 
			oldPos 		= position;

		// choose the next direction, depending on the game mode (automatic or manual)
		if (mode==="a")
		{
			//  auto
			
			var onGrid = onGridSquare(position);
			
			if (due!=direction) {
				npos = getNewCoord(due, position);
				
				if (onGrid &&
					map.isFloorSpace({
						"y":pointToCoord(nextSquare(npos.y, due)),
						"x":pointToCoord(nextSquare(npos.x, due))})) {
					direction = due;
				} else {
					npos = null;
				}
			}
			
			if (npos === null) {
				npos = getNewCoord(direction, position);
			}
			
			if (onGrid &&
				map.isWallSpace({
					"y" : pointToCoord(nextSquare(npos.y, direction)),
					"x" : pointToCoord(nextSquare(npos.x, direction))
				})) {
				
				due = getSafeDirection(npos, ghostPos, ghosts);
				return move(ctx);
			}

			position = npos;
			
			var tmp = pane(position);
			if (tmp) { 
				position = tmp;
			}

			due = getSafeDirection(position, ghostPos, ghosts);
		}
		else
		{
			// manual
			var nextWhole   = null, 
				block	   = null;
			
			if (due !== direction) {
				npos = getNewCoord(due, position);
				
				if (isOnSamePlane(due, direction) || 
					(onGridSquare(position) && 
					 map.isFloorSpace(next(npos, due)))) {
					direction = due;
				} else {
					npos = null;
				}
			}

			if (npos === null) {
				npos = getNewCoord(direction, position);
			}
			
			if (onGridSquare(position) && map.isWallSpace(next(npos, direction))) {
				direction = NONE;
			}

			if (direction === NONE) {
				return {"new" : position, "old" : position};
			}
			
			if (npos.y === 100 && npos.x >= 190 && direction === RIGHT) {
				npos = {"y": 100, "x": -10};
			}
			
			if (npos.y === 100 && npos.x <= -12 && direction === LEFT) {
				npos = {"y": 100, "x": 190};
			}
			
			position = npos;		
		}
		
		nextWhole = next(position, direction);

		block = map.block(nextWhole);		

		if ((isMidSquare(position.y) || isMidSquare(position.x)) &&
			block === Pacman.BISCUIT || block === Pacman.PILL) {
			
			map.setBlock(nextWhole, Pacman.EMPTY);		   
			addScore((block === Pacman.BISCUIT) ? 10 : 50);
			eaten += 1;
			
			if (eaten === 182) {
				game.completedLevel();
			}
			
			if (block === Pacman.PILL) { 
				game.eatenPill();
			}
		}   
		
		return {
			"new" : position,
			"old" : oldPos
		};
	};

	function isMidSquare(x) { 
		var rem = x % 10;
		return rem > 3 || rem < 7;
	};

	function calcAngle(dir, pos) { 
		if (dir == RIGHT && (pos.x % 10 < 5)) {
			return {"start":0.25, "end":1.75, "direction": false};
		} else if (dir === DOWN && (pos.y % 10 < 5)) { 
			return {"start":0.75, "end":2.25, "direction": false};
		} else if (dir === UP && (pos.y % 10 < 5)) { 
			return {"start":1.25, "end":1.75, "direction": true};
		} else if (dir === LEFT && (pos.x % 10 < 5)) {			 
			return {"start":0.75, "end":1.25, "direction": true};
		}
		return {"start":0, "end":2, "direction": false};
	};

	function drawDead(ctx, amount) { 

		var size = map.blockSize, 
			half = size / 2;

		if (amount >= 1) { 
			return;
		}

		ctx.fillStyle = "#FFFF00";
		ctx.beginPath();		
		ctx.moveTo(((position.x/10) * size) + half, 
				   ((position.y/10) * size) + half);

		ctx.arc(((position.x/10) * size) + half, 
				((position.y/10) * size) + half,
				half, 0, Math.PI * 2 * amount, true); 
		ctx.fill();
	};

	function draw(ctx) { 

		var s	 = map.blockSize, 
			angle = calcAngle(direction, position);

		ctx.fillStyle = "#FFFF00";

		ctx.beginPath();		

		ctx.moveTo(((position.x/10) * s) + s / 2,
					((position.y/10) * s) + s / 2);
		ctx.arc(((position.x/10) * s) + s / 2,
				((position.y/10) * s) + s / 2,
				s / 2, Math.PI * angle.start, 
				Math.PI * angle.end, angle.direction); 
		
		ctx.fill();
	};
	initUser();

	return {
		"draw"			: draw,
		"drawDead"		: drawDead,
		"loseLife"		: loseLife,
		"getLives"		: getLives,
		"score"			: score,
		"addScore"		: addScore,
		"theScore"		: theScore,
		"keyDown"		: keyDown,
		"move"			: move,
		"newLevel"		: newLevel,
		"reset"			: reset,
		"resetPosition"	: resetPosition
	};
};

Pacman.Map = function (size) {
	var height	= null, 
		width	 = null, 
		blockSize = size,
		pillSize  = 0,
		map	   = null,
		mapGhosts = null,
		posGhosts = {};
	
	function withinBounds(y, x) {
		return y >= 0 && y < height && x >= 0 && x < width;
	}

	function isWall(pos) {
		return withinBounds(pos.y, pos.x) && map[pos.y][pos.x] === Pacman.WALL;
	}

	function isFloorSpace(pos) {
		if (!withinBounds(pos.y, pos.x)) {
			return false;
		}
		var peice = map[pos.y][pos.x];
		return peice === Pacman.EMPTY || 
			peice === Pacman.BISCUIT ||
			peice === Pacman.PILL;
	}

	function drawWall(ctx) {
		var i, j, p, line;

		ctx.strokeStyle = "#0000FF";
		ctx.lineWidth   = 5;
		ctx.lineCap	 = "round";

		for (i = 0; i < Pacman.WALLS.length; i += 1) {
			line = Pacman.WALLS[i];
			ctx.beginPath();

			for (j = 0; j < line.length; j += 1) {
				p = line[j];
				if (p.move) {
					ctx.moveTo(p.move[0] * blockSize, p.move[1] * blockSize);
				} else if (p.line) {
					ctx.lineTo(p.line[0] * blockSize, p.line[1] * blockSize);
				} else if (p.curve) {
					ctx.quadraticCurveTo(p.curve[0] * blockSize,
										 p.curve[1] * blockSize,
										 p.curve[2] * blockSize,
										 p.curve[3] * blockSize);
				}
			}
			ctx.stroke();
		}
	}

			// add points
		function pointToCoord(x) {
		return Math.round(x / 10);
	};

	function setGhost(id, pos) {
		if (id in posGhosts)
			mapGhosts[posGhosts[id].y][posGhosts[id].x] = 0;

		posGhosts[id] = {"x": pointToCoord(pos.x), "y": pointToCoord(pos.y)};
		mapGhosts[posGhosts[id].y][posGhosts[id].x] = id;
	};
	
	function getGhostBlock(pos) {
		return mapGhosts[pos.y][pos.x];
	}
	
	function getGhosts() {
		return mapGhosts;
	}
	
	function getMap() {
		return map;
	}

	function reset() {
		map		  = Pacman.MAP.clone();
		height	= map.length;
		width	 = map[0].length;		
		mapGhosts = Pacman.MAP.clone();
		for (var i=0; i<height; i++)
			for (var j=0; j<width; j++)
				mapGhosts[i][j] = 0;
	};

	function block(pos) {
		return map[pos.y][pos.x];
	};
	
	function setBlock(pos, type) {
		map[pos.y][pos.x] = type;
	};

	function drawPills(ctx) { 

		if (++pillSize > 30) {
			pillSize = 0;
		}

		for (i = 0; i < height; i += 1) {
			for (j = 0; j < width; j += 1) {
				if (map[i][j] === Pacman.PILL) {
					ctx.beginPath();

					ctx.fillStyle = "#000";
					ctx.fillRect((j * blockSize), (i * blockSize), 
								 blockSize, blockSize);

					ctx.fillStyle = "#FFF";
					ctx.arc((j * blockSize) + blockSize / 2,
							(i * blockSize) + blockSize / 2,
							Math.abs(5 - (pillSize/3)), 
							0, 
							Math.PI * 2, false); 
					ctx.fill();
					ctx.closePath();
				}
			}
		}
	};
	
	function draw(ctx) {
		
		var i, j, size = blockSize;

		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, width * size, height * size);

		drawWall(ctx);
		
		for (i = 0; i < height; i += 1) {
			for (j = 0; j < width; j += 1) {
				drawBlock(i, j, ctx);
			}
		}
	};
	
	function drawBlock(y, x, ctx) {

		var layout = map[y][x];

		if (layout === Pacman.PILL) {
			return;
		}

		ctx.beginPath();
		
		if (layout === Pacman.EMPTY || layout === Pacman.BLOCK || 
			layout === Pacman.BISCUIT) {
			
			ctx.fillStyle = "#000";
			ctx.fillRect((x * blockSize), (y * blockSize), 
						 blockSize, blockSize);

			if (layout === Pacman.BISCUIT) {
				ctx.fillStyle = "#FFF";
				ctx.fillRect((x * blockSize) + (blockSize / 2.5), 
							 (y * blockSize) + (blockSize / 2.5), 
							 blockSize / 6, blockSize / 6);
			}
		}
		ctx.closePath();	 
	};
	
	reset();
	
	return {
		"draw"		 : draw,
		"drawBlock"	: drawBlock,
		"drawPills"	: drawPills,
		"block"		: block,
		"setBlock"	 : setBlock,
		"reset"		: reset,
		"isWallSpace"  : isWall,
		"isFloorSpace" : isFloorSpace,
		"height"	   : height,
		"width"		: width,
		"blockSize"	: blockSize,
		"setGhost"	   : setGhost,
		"getGhostBlock": getGhostBlock,
		"getGhosts"	   : getGhosts,
		"getMap"	   : getMap
	};
};

var PACMAN = (function () {

	var state			= WAITING,
		ghosts			= [],
		ghostSpecs		= ["#00FFDE", "#FF0000", "#FFB8DE", "#FFB847"],
		eatenCount		= 0,
		level			= 0,
		tick			= 0,
		ghostPos, userPos, 
		stateChanged	= true,
		timerStart		= null,
		lastTime		= 0,
		ctx				= null,
		timer			= null,
		map				= null,
		user			= null,
		stored			= null,
		MODE			= "n";

	function getTick() { 
		return tick;
	};

	function drawScore(text, position) {
		ctx.fillStyle = "#FFFFFF";
		ctx.font	  = "12px BDCartoonShoutRegular";
		ctx.fillText(text, 
					 (position["new"]["x"] / 10) * map.blockSize, 
					 ((position["new"]["y"] + 5) / 10) * map.blockSize);
	}

	function dialog(text, tm=0) {
		ctx.fillStyle = "#FFFF00";
		ctx.font	  = "20px BDCartoonShoutRegular";
		var width = ctx.measureText(text).width,
			x	 = ((map.width * map.blockSize) - width) / 2;
		ctx.fillText(text, x, (map.height * 10) + 8 + tm);
	}

	function startLevel() {
		user.resetPosition();
		for (var i = 0; i < ghosts.length; i += 1) { 
			ghosts[i].reset();
		}
		timerStart = tick;
		setState(COUNTDOWN);
	}

	function startNewGame(mode) {
		MODE = mode;
		setState(WAITING);
		level = 1;
		user.reset();
		map.reset();
		map.draw(ctx);
		startLevel();
	}
		//to pause the game
	function keyDown(e) {
		if (e.keyCode === KEY.N) {
			startNewGame("n");
		} else if (e.keyCode === KEY.A) {
			startNewGame("a");
		} else if (e.keyCode === KEY.P && state === PAUSE) {
			map.draw(ctx);
			setState(stored);
		} else if (e.keyCode === KEY.P) {
			stored = state;
			setState(PAUSE);
			map.draw(ctx);
			dialog("توقف اللعب مؤقتاّ");
		} else if (state !== PAUSE && MODE==="n") {   
			return user.keyDown(e);
		}
		return true;
	}	

	function loseLife() {
		setState(WAITING);
		user.loseLife();
		if (user.getLives() > 0) {
			startLevel();
		}
	}

	function setState(nState) { 
		state = nState;
		stateChanged = true;
	};
	
	function collided(user, ghost) {
		return (Math.sqrt(Math.pow(ghost.x - user.x, 2) + 
						  Math.pow(ghost.y - user.y, 2))) < 10;
	};

	function drawFooter() {
		
		var topLeft  = (map.height * map.blockSize),
			textBase = topLeft + 17;
		
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, topLeft, (map.width * map.blockSize), 30);
		
		ctx.fillStyle = "#FFFF00";

		for (var i = 0, len = user.getLives(); i < len; i++) {
			ctx.fillStyle = "#FFFF00";
			ctx.beginPath();
			ctx.moveTo(150 + (25 * i) + map.blockSize / 2,
					   (topLeft+1) + map.blockSize / 2);
			
			ctx.arc(150 + (25 * i) + map.blockSize / 2,
					(topLeft+1) + map.blockSize / 2,
					map.blockSize / 2, Math.PI * 0.25, Math.PI * 1.75, false);
			ctx.fill();
		}

		ctx.fillStyle = "#FFFF00";
		ctx.font	  = "16px BDCartoonShoutRegular";
		ctx.fillText("عدد النقاط: " + user.theScore(), 30, textBase);
		ctx.fillText("المستوي: " + level, 260, textBase);
	}

	function redrawBlock(pos) {
		map.drawBlock(Math.floor(pos.y/10), Math.floor(pos.x/10), ctx);
		map.drawBlock(Math.ceil(pos.y/10), Math.ceil(pos.x/10), ctx);
	}

	function mainDraw() { 

		var diff, u, i, len, nScore;
		
		ghostPos = [];

		for (i = 0, len = ghosts.length; i < len; i += 1) {
			ghostPos.push(ghosts[i].move(ctx));
		}
		
		u = user.move(ctx, MODE, ghostPos, ghosts);

		for (i = 0, len = ghosts.length; i < len; i += 1) {
			redrawBlock(ghostPos[i].old);
		}
		redrawBlock(u.old);
		
		for (i = 0, len = ghosts.length; i < len; i += 1) {
			ghosts[i].draw(ctx);
		}					 
		user.draw(ctx);
		
		userPos = u["new"];
		
		for (i = 0, len = ghosts.length; i < len; i += 1) {
			if (collided(userPos, ghostPos[i]["new"])) {
				if (ghosts[i].isVunerable()) {
					ghosts[i].eat();
					eatenCount += 1;
					nScore = eatenCount * 50;
					drawScore(nScore, ghostPos[i]);
					user.addScore(nScore);					
					setState(EATEN_PAUSE);
					timerStart = tick;
				} else if (ghosts[i].isDangerous()) {
					setState(DYING);
					timerStart = tick;
				}
			}
		}							 
	};

	function mainLoop() {

		var diff;

		if (state !== PAUSE) { 
			++tick;
		}

		map.drawPills(ctx);

		if (state === PLAYING) {
			mainDraw();
		} else if (state === WAITING && stateChanged) {			
			stateChanged = false;
			map.draw(ctx);
			dialog("A--N -- لإختيار اللعب الطبيعي أو التلقائي");
			dialog("N -- للعب الطبيعي أنقر حرف", 25);
			dialog("A -- للعب التلقائي أنقر حرف", 50);
		} else if (state === EATEN_PAUSE && 
				   (tick - timerStart) > (Pacman.FPS / 3)) {
			map.draw(ctx);
			setState(PLAYING);
		} else if (state === DYING) {
			if (tick - timerStart > (Pacman.FPS * 2)) { 
				loseLife();
			} else { 
				redrawBlock(userPos);
				for (i = 0, len = ghosts.length; i < len; i += 1) {
					redrawBlock(ghostPos[i].old);
					ghostPos.push(ghosts[i].draw(ctx));
				}								   
				user.drawDead(ctx, (tick - timerStart) / (Pacman.FPS * 2));
			}
		} else if (state === COUNTDOWN) {
			
			diff = 3 + Math.floor((timerStart - tick) / Pacman.FPS);
			
			if (diff === 0) {
				map.draw(ctx);
				setState(PLAYING);
			} else {
				if (diff !== lastTime) { 
					lastTime = diff;
					map.draw(ctx);
					dialog("يبدأ اللعب بعد: " + diff + "  ثانية/ثواني  ");
				}
			}
		} 

		drawFooter();
	}

	function eatenPill() {
		timerStart = tick;
		eatenCount = 0;
		for (i = 0; i < ghosts.length; i += 1) {
			ghosts[i].makeEatable(ctx);
		}		
	};
	
	function completedLevel() {
		setState(WAITING);
		level += 1;
		map.reset();
		user.newLevel();
		startLevel();
	};

	function keyPress(e) { 
		if (state !== WAITING && state !== PAUSE) { 
			e.preventDefault();
			e.stopPropagation();
		}
	};
	
	function init(wrapper, root) {
		
		var i, len, ghost,
			blockSize = wrapper.offsetWidth / 19,
			canvas	= document.createElement("canvas");
		
		canvas.setAttribute("width", (blockSize * 19) + "px");
		canvas.setAttribute("height", (blockSize * 22) + 30 + "px");

		wrapper.appendChild(canvas);

		ctx  = canvas.getContext('2d');

		map   = new Pacman.Map(blockSize);

		for (i = 0, len = ghostSpecs.length; i < len; i += 1) {
			ghost = new Pacman.Ghost({"getTick":getTick}, map, ghostSpecs[i], i+1);
			ghosts.push(ghost);
		}

		user  = new Pacman.User({ 
			"completedLevel" : completedLevel, 
			"eatenPill"	  : eatenPill 
		}, map, ghosts);
		
		map.draw(ctx);

		dialog("أنقر علي الحرف N (طبيعي) أو الحرف A (تلقائي) لبدأ اللعب");
		
		document.addEventListener("keydown", keyDown, true);
		document.addEventListener("keypress", keyPress, true); 
		
		timer = window.setInterval(mainLoop, 1000 / Pacman.FPS);
	};
	
	return {
		"init" : init
	};
	
}());
// تعريف الأزرر للتحرك
var KEY = {'BACKSPACE': 8, 'TAB': 9, 'NUM_PAD_CLEAR': 12, 'ENTER': 13, 'SHIFT': 16, 'CTRL': 17, 'ALT': 18, 'PAUSE': 19, 'CAPS_LOCK': 20, 'ESCAPE': 27, 'SPACEBAR': 32, 'PAGE_UP': 33, 'PAGE_DOWN': 34, 'END': 35, 'HOME': 36, 'ARROW_LEFT': 37, 'ARROW_UP': 38, 'ARROW_RIGHT': 39, 'ARROW_DOWN': 40, 'PRINT_SCREEN': 44, 'INSERT': 45, 'DELETE': 46, 'SEMICOLON': 59, 'WINDOWS_LEFT': 91, 'WINDOWS_RIGHT': 92, 'SELECT': 93, 'NUM_PAD_ASTERISK': 106, 'NUM_PAD_PLUS_SIGN': 107, 'NUM_PAD_HYPHEN-MINUS': 109, 'NUM_PAD_FULL_STOP': 110, 'NUM_PAD_SOLIDUS': 111, 'NUM_LOCK': 144, 'SCROLL_LOCK': 145, 'SEMICOLON': 186, 'EQUALS_SIGN': 187, 'COMMA': 188, 'HYPHEN-MINUS': 189, 'FULL_STOP': 190, 'SOLIDUS': 191, 'GRAVE_ACCENT': 192, 'LEFT_SQUARE_BRACKET': 219, 'REVERSE_SOLIDUS': 220, 'RIGHT_SQUARE_BRACKET': 221, 'APOSTROPHE': 222};

(function () {
	for (var i = 48; i <= 57; i++) {
		KEY['' + (i - 48)] = i;
	}
	for (i = 65; i <= 90; i++) {
		KEY['' + String.fromCharCode(i)] = i;
	}
	for (i = 96; i <= 105; i++) {
		KEY['NUM_PAD_' + (i - 96)] = i;
	}
	for (i = 112; i <= 123; i++) {
		KEY['F' + (i - 112 + 1)] = i;
	}
})();

Pacman.WALL	= 0;
Pacman.BISCUIT = 1;
Pacman.EMPTY   = 2;
Pacman.BLOCK   = 3;
Pacman.PILL	= 4;
//the map
Pacman.MAP = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
	[0, 4, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 4, 0],
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 0],
	[0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
	[0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
	[0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
	[2, 2, 2, 0, 1, 0, 4, 1, 1, 1, 1, 1, 4, 0, 1, 0, 2, 2, 2],
	[0, 0, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 0],
	[2, 2, 2, 2, 1, 1, 1, 0, 3, 3, 3, 0, 1, 1, 1, 2, 2, 2, 2],
	[0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
	[2, 2, 2, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 2, 2, 2],
	[0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 4, 1, 0, 1, 1, 4, 1, 1, 1, 1, 1, 4, 1, 1, 0, 1, 4, 0],
	[0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
	[0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

Pacman.WALLS = [
	
	[{"move": [0, 9.5]}, {"line": [3, 9.5]},
	 {"curve": [3.5, 9.5, 3.5, 9]}, {"line": [3.5, 8]},
	 {"curve": [3.5, 7.5, 3, 7.5]}, {"line": [1, 7.5]},
	 {"curve": [0.5, 7.5, 0.5, 7]}, {"line": [0.5, 1]},
	 {"curve": [0.5, 0.5, 1, 0.5]}, {"line": [9, 0.5]},
	 {"curve": [9.5, 0.5, 9.5, 1]}, {"line": [9.5, 3.5]}],

	[{"move": [9.5, 1]},
	 {"curve": [9.5, 0.5, 10, 0.5]}, {"line": [18, 0.5]},
	 {"curve": [18.5, 0.5, 18.5, 1]}, {"line": [18.5, 7]},
	 {"curve": [18.5, 7.5, 18, 7.5]}, {"line": [16, 7.5]},
	 {"curve": [15.5, 7.5, 15.5, 8]}, {"line": [15.5, 9]},
	 {"curve": [15.5, 9.5, 16, 9.5]}, {"line": [19, 9.5]}],

	[{"move": [2.5, 5.5]}, {"line": [3.5, 5.5]}],

	[{"move": [3, 2.5]},
	 {"curve": [3.5, 2.5, 3.5, 3]},
	 {"curve": [3.5, 3.5, 3, 3.5]},
	 {"curve": [2.5, 3.5, 2.5, 3]},
	 {"curve": [2.5, 2.5, 3, 2.5]}],

	[{"move": [15.5, 5.5]}, {"line": [16.5, 5.5]}],

	[{"move": [16, 2.5]}, {"curve": [16.5, 2.5, 16.5, 3]},
	 {"curve": [16.5, 3.5, 16, 3.5]}, {"curve": [15.5, 3.5, 15.5, 3]},
	 {"curve": [15.5, 2.5, 16, 2.5]}],

	[{"move": [6, 2.5]}, {"line": [7, 2.5]}, {"curve": [7.5, 2.5, 7.5, 3]},
	 {"curve": [7.5, 3.5, 7, 3.5]}, {"line": [6, 3.5]},
	 {"curve": [5.5, 3.5, 5.5, 3]}, {"curve": [5.5, 2.5, 6, 2.5]}],

	[{"move": [12, 2.5]}, {"line": [13, 2.5]}, {"curve": [13.5, 2.5, 13.5, 3]},
	 {"curve": [13.5, 3.5, 13, 3.5]}, {"line": [12, 3.5]},
	 {"curve": [11.5, 3.5, 11.5, 3]}, {"curve": [11.5, 2.5, 12, 2.5]}],

	[{"move": [7.5, 5.5]}, {"line": [9, 5.5]}, {"curve": [9.5, 5.5, 9.5, 6]},
	 {"line": [9.5, 7.5]}],
	[{"move": [9.5, 6]}, {"curve": [9.5, 5.5, 10.5, 5.5]},
	 {"line": [11.5, 5.5]}],


	[{"move": [5.5, 5.5]}, {"line": [5.5, 7]}, {"curve": [5.5, 7.5, 6, 7.5]},
	 {"line": [7.5, 7.5]}],
	[{"move": [6, 7.5]}, {"curve": [5.5, 7.5, 5.5, 8]}, {"line": [5.5, 9.5]}],

	[{"move": [13.5, 5.5]}, {"line": [13.5, 7]},
	 {"curve": [13.5, 7.5, 13, 7.5]}, {"line": [11.5, 7.5]}],
	[{"move": [13, 7.5]}, {"curve": [13.5, 7.5, 13.5, 8]},
	 {"line": [13.5, 9.5]}],

	[{"move": [0, 11.5]}, {"line": [3, 11.5]}, {"curve": [3.5, 11.5, 3.5, 12]},
	 {"line": [3.5, 13]}, {"curve": [3.5, 13.5, 3, 13.5]}, {"line": [1, 13.5]},
	 {"curve": [0.5, 13.5, 0.5, 14]}, {"line": [0.5, 17]},
	 {"curve": [0.5, 17.5, 1, 17.5]}, {"line": [1.5, 17.5]}],
	[{"move": [1, 17.5]}, {"curve": [0.5, 17.5, 0.5, 18]}, {"line": [0.5, 21]},
	 {"curve": [0.5, 21.5, 1, 21.5]}, {"line": [18, 21.5]},
	 {"curve": [18.5, 21.5, 18.5, 21]}, {"line": [18.5, 18]},
	 {"curve": [18.5, 17.5, 18, 17.5]}, {"line": [17.5, 17.5]}],
	[{"move": [18, 17.5]}, {"curve": [18.5, 17.5, 18.5, 17]},
	 {"line": [18.5, 14]}, {"curve": [18.5, 13.5, 18, 13.5]},
	 {"line": [16, 13.5]}, {"curve": [15.5, 13.5, 15.5, 13]},
	 {"line": [15.5, 12]}, {"curve": [15.5, 11.5, 16, 11.5]},
	 {"line": [19, 11.5]}],

	[{"move": [5.5, 11.5]}, {"line": [5.5, 13.5]}],
	[{"move": [13.5, 11.5]}, {"line": [13.5, 13.5]}],

	[{"move": [2.5, 15.5]}, {"line": [3, 15.5]},
	 {"curve": [3.5, 15.5, 3.5, 16]}, {"line": [3.5, 17.5]}],
	[{"move": [16.5, 15.5]}, {"line": [16, 15.5]},
	 {"curve": [15.5, 15.5, 15.5, 16]}, {"line": [15.5, 17.5]}],

	[{"move": [5.5, 15.5]}, {"line": [7.5, 15.5]}],
	[{"move": [11.5, 15.5]}, {"line": [13.5, 15.5]}],
	
	[{"move": [2.5, 19.5]}, {"line": [5, 19.5]},
	 {"curve": [5.5, 19.5, 5.5, 19]}, {"line": [5.5, 17.5]}],
	[{"move": [5.5, 19]}, {"curve": [5.5, 19.5, 6, 19.5]},
	 {"line": [7.5, 19.5]}],

	[{"move": [11.5, 19.5]}, {"line": [13, 19.5]},
	 {"curve": [13.5, 19.5, 13.5, 19]}, {"line": [13.5, 17.5]}],
	[{"move": [13.5, 19]}, {"curve": [13.5, 19.5, 14, 19.5]},
	 {"line": [16.5, 19.5]}],

	[{"move": [7.5, 13.5]}, {"line": [9, 13.5]},
	 {"curve": [9.5, 13.5, 9.5, 14]}, {"line": [9.5, 15.5]}],
	[{"move": [9.5, 14]}, {"curve": [9.5, 13.5, 10, 13.5]},
	 {"line": [11.5, 13.5]}],

	[{"move": [7.5, 17.5]}, {"line": [9, 17.5]},
	 {"curve": [9.5, 17.5, 9.5, 18]}, {"line": [9.5, 19.5]}],
	[{"move": [9.5, 18]}, {"curve": [9.5, 17.5, 10, 17.5]},
	 {"line": [11.5, 17.5]}],

	[{"move": [8.5, 9.5]}, {"line": [8, 9.5]}, {"curve": [7.5, 9.5, 7.5, 10]},
	 {"line": [7.5, 11]}, {"curve": [7.5, 11.5, 8, 11.5]},
	 {"line": [11, 11.5]}, {"curve": [11.5, 11.5, 11.5, 11]},
	 {"line": [11.5, 10]}, {"curve": [11.5, 9.5, 11, 9.5]},
	 {"line": [10.5, 9.5]}]
];

Object.prototype.clone = function () {
	var i, newObj = (this instanceof Array) ? [] : {};
	for (i in this) {
		if (i === 'clone') {
			continue;
		}
		if (this[i] && typeof this[i] === "object") {
			newObj[i] = this[i].clone();
		} else {
			newObj[i] = this[i];
		}
	}
	return newObj;
};

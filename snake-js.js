
function SnakeJS(parentElement, config){

	var utilities = new Utilities();

	var defaultConfig = {
		autoInit : true,					
		gridWidth : 45,						
		gridHeight : 25,					
		frameInterval : 500000,				
		pointSize : 16,						
		backgroundColor : "#f3e698",		
		snakeColor : "#4b4312",				
		snakeEyeColor : "white",			
		candyColor : "#b11c1c",				
		shrinkingCandyColor : "#199C2C",	
		scoreBoardColor : "#c0c96b",		
		scoreTextColor : "#4b4312",			
		collisionTolerance : 1				
	};

	var config = config ? utilities.mergeObjects(defaultConfig, config) : defaultConfig ;

	var constants = {
		DIRECTION_UP : 1,
		DIRECTION_RIGHT : 2,
		DIRECTION_DOWN : -1,
		DIRECTION_LEFT : -2,
		DEFAULT_DIRECTION : 2,
		STATE_READY : 1,
		STATE_PAUSED : 2,
		STATE_PLAYING : 3,
		STATE_GAME_OVER : 4,
		INITIAL_SNAKE_GROWTH_LEFT : 6,
		SCOREBOARD_HEIGHT : 20,
		CANDY_REGULAR : 1,
		CANDY_MASSIVE : 2,
		CANDY_SHRINKING : 3
	};

	var engine = new Engine(parentElement);

	/**
	 * untuk memanggil method (init, pause, resume).
	 */
	this.init = function(){
		engine.initGame();
	};

	this.pause = function(){
		engine.pauseGame();
	};

	this.resume = function(){
		engine.resume();
	};

	this.getHighScore = function(){
		return engine.getHighScore();
	};

	function resumebutton(){
		return resume();	
	};

	function pausebutton(){
		return pauseGame();
	};
	/**
	 * GAME MODEL OBJECT
	 *
	 * objek untuk pengaturan logika pada game, frame management dll.
	 */
	function Engine(parentElement) {
		
		var snake,					
			candy,					
			view,					
			inputInterface,			
			grid,					
			currentState,			
			frameIntervalId,		
			score,					
			highScore,				
			collisionFramesLeft;	

		this.initGame = function(){

			view = new View(parentElement, config.backgroundColor);
			inputInterface = new InputInterface(this.pauseGame, this.resumeGame, startMoving);

			snake = new Snake();
			grid = new Grid(config.gridWidth, config.gridHeight);
			score = 0;
			highScore = score;

			// membuat tubuh ular
			snake.points.push(randomPoint(grid));
			snake.growthLeft = constants.INITIAL_SNAKE_GROWTH_LEFT;

			candy = randomCandy();

			view.initPlayField();
			drawCurrentScene();
			inputInterface.startListening();
			currentState = constants.STATE_READY;
		};

		this.pauseGame = function (){
			if (currentState === constants.STATE_PLAYING) {
				clearInterval(frameIntervalId);
				currentState = constants.STATE_PAUSED;
			}
		};

		this.resumeGame = function(){
			if (currentState === constants.STATE_PAUSED) {
				frameIntervalId = setInterval(nextFrame, config.frameInterval);
				currentState = constants.STATE_PLAYING;
			}
		};

		this.getHighScore = function(){
			return highScore;
		};

		/**
		 * method privat
		 */

		var gameOver = function(){
			currentState = constants.STATE_GAME_OVER;
			clearInterval(frameIntervalId);

			var removeTail = function(){
				if (snake.points.length > 1) {
					snake.points.pop();
					drawCurrentScene();
					setTimeout(removeTail, config.frameInterval/4);
				}
				else
					setTimeout(resurrect, config.frameInterval * 10);
			};

			var resurrect = function (){
				score = 0;
				snake.growthLeft = constants.INITIAL_SNAKE_GROWTH_LEFT;
				snake.alive = true;
				drawCurrentScene();
				currentState = constants.STATE_READY;
			};

			setTimeout(removeTail, config.frameInterval * 10);
		};

		var startMoving = function(){
			if (currentState === constants.STATE_READY) {
				frameIntervalId = setInterval(nextFrame, config.frameInterval);
				currentState = constants.STATE_PLAYING;
			}
		};

		var nextFrame = function(){

			if (!moveSnake(inputInterface.lastDirection())) {
				if (collisionFramesLeft > 0) {

					collisionFramesLeft--;
					return;
				}
				else {
					
					snake.alive = false;
					
					drawCurrentScene();
					
					gameOver();
					return;
				}
			}
			else
				collisionFramesLeft = config.collisionTolerance;

			if (!candy.age())
					candy = randomCandy();

			if(candy.point.collidesWith(snake.points[0])) {
				eatCandy();
				candy = randomCandy();
			}

			drawCurrentScene();

		};

		var drawCurrentScene = function() {
			
			view.clear();
			// Draw the objects to the screen
			view.drawSnake(snake, config.snakeColor);
			view.drawCandy(candy);
			view.drawScore( "score " + score, "High Score " + highScore);
			document.getElementById("score").innerHTML = "Score : " + score;
			document.getElementById("high_score").innerHTML = "High Score : " + highScore;
		};

		var moveSnake = function(desiredDirection){
			var head = snake.points[0];

			var newDirection = actualDirection(desiredDirection || constants.DEFAULT_DIRECTION);

			var newHead = movePoint(head, newDirection);

			if (!insideGrid(newHead, grid))
				shiftPointIntoGrid(newHead, grid);

			if (snake.collidesWith(newHead, true)) {
				return false;
			}

			snake.direction = newDirection;
			snake.points.unshift(newHead);

			if (snake.growthLeft >= 1)
				snake.growthLeft--;
			else
				snake.points.pop();
			
			return true;
		};

		var eatCandy = function(){
			score += candy.score;
			highScore = Math.max(score, highScore);
			snake.growthLeft += candy.calories;
		};

		var randomCandy = function() {
			do {
				var newCandyPoint = randomPoint(grid);
			} while(snake.collidesWith(newCandyPoint));
			
			var probabilitySeed = Math.random();
			if (probabilitySeed < 0.75)
				var newType = constants.CANDY_REGULAR;
			else if (probabilitySeed < 0.95)
				var newType = constants.CANDY_MASSIVE;
			else
				var newType = constants.CANDY_SHRINKING;
			return new Candy(newCandyPoint, newType);
		};

		var actualDirection = function(desiredDirection){
			if (snake.points.length === 1)
				return desiredDirection;
			else if (utilities.oppositeDirections(snake.direction, desiredDirection)) {
				
				return snake.direction;
			}
			else {

				return desiredDirection;
			}
		};

		var movePoint = function(oldPoint, direction){
			var newPoint;
			with (constants) {
				switch (direction) {
				case DIRECTION_LEFT:
					newPoint = new Point(oldPoint.left-1, oldPoint.top);
					break;
				case DIRECTION_UP:
					newPoint = new Point(oldPoint.left, oldPoint.top-1);
					break;
				case DIRECTION_RIGHT:
					newPoint = new Point(oldPoint.left+1, oldPoint.top);
					break;
				case DIRECTION_DOWN:
					newPoint = new Point(oldPoint.left, oldPoint.top+1);
					break;
				}
			}
			return newPoint;
		};

		var shiftPointIntoGrid = function(point, grid){
			point.left = shiftIntoRange(point.left, grid.width);
			point.top = shiftIntoRange(point.top, grid.height);
			return point;
		};

		var shiftIntoRange = function(number, range) {
			var shiftedNumber, steps;
			if (utilities.sign(number) == 1){
				steps = Math.floor(number/range);
				shiftedNumber = number - (range * steps);
			}
			else if (utilities.sign(number) == -1){
				steps = Math.floor(Math.abs(number)/range) + 1;
				shiftedNumber = number + (range * steps);
			}
			else {
				shiftedNumber = number;
			}
			return shiftedNumber;
		};

		var insideGrid = function(point, grid){
			if (point.left < 0 || point.top < 0 ||
					point.left >= grid.width || point.top >= grid.height){
				return false;
			}
			else {
				return true;
			}
		};

		var randomPoint = function(grid){
			var left = utilities.randomInteger(0, grid.width - 1);
			var top = utilities.randomInteger(0, grid.height - 1);
			var point = new Point(left, top);
			return point;
		};
	}

	function Grid(width, height) {
		this.width = width;
		this.height = height;
	}

	/**
	 * SNAKE OBJECT
	 */
	function Snake() {
		this.direction = constants.DEFAULT_DIRECTION;
		this.points = [];
		this.growthLeft = 0;
		this.alive = true;

		this.collidesWith = function(point, simulateMovement){
			if (simulateMovement && this.growthLeft === 0)
				
				range = this.points.length - 1;
			else
				range = this.points.length;
			for (var i = 0; i < range; i++) {
				if (point.collidesWith(this.points[i]))
					return true;
			}
			return false;
		};
	}

	function Point(left, top) {
		this.left = left;
		this.top = top;

		this.collidesWith = function(otherPoint){
			if (otherPoint.left == this.left && otherPoint.top == this.top)
				return true;
			else
				return false;
		};
	}

	/**
	 * CANDY OBJECT
	 */
	function Candy(point, type){
		this.point = point,
		this.type = type,
		this.score,			
		this.calories,		
		this.radius,		
		this.color,			
		this.decrement,		
		this.minRadius;		

		switch (type) {
		case constants.CANDY_REGULAR:
			this.score = 5;
			this.calories = 3;
			this.radius = 0.3;
			this.color = config.candyColor;
			break;
		case constants.CANDY_MASSIVE:
			this.score = 15;
			this.calories = 5;
			this.radius = 0.45;
			this.color = config.candyColor;
			break;
		case constants.CANDY_SHRINKING:
			this.score = 50;
			this.calories = 0;
			this.radius = 0.45;
			this.color = config.shrinkingCandyColor;
			this.decrement = 0.008;
			this.minRadius = 0.05;
			break;
		}

		this.age = function(){
			if (this.type === constants.CANDY_SHRINKING) {
				this.radius -= this.decrement;
				if (this.radius < this.minRadius)
					return false;
				else
					return true;
			}
			else
				return true;
		};
	};
	
	/**
	 * UTILITI OBJECT
	 */
	function Utilities() {

		this.sign = function(number){
			if(number > 0)
				return 1;
			else if (number < 0)
				return -1;
			else if (number === 0)
				return 0;
			else
				return undefined;
		};

		this.oppositeDirections = function(direction1, direction2){
	
			if (Math.abs(direction1) == Math.abs(direction2) &&
					this.sign(direction1 * direction2) == -1) {
				return true;
			}
			else {
				return false;
			}
		};

		this.mergeObjects = function mergeObjects(slave, master){
			var merged = {};
			for (key in slave) {
				if (typeof master[key] === "undefined")
					merged[key] = slave[key];
				else
					merged[key] = master[key];
			}
			return merged;
		};

		this.randomInteger = function(min, max){
			var randomNumber = min + Math.floor(Math.random() * (max + 1));
			return randomNumber;
		};
	}

	/**
	 * VIEW OBJECT
	 */
	function View(parentElement, backgroundColor) {
		var playField,			
			ctx,				
			snakeThickness;		

		this.initPlayField = function(){
			snakeThickness = length(0.9);

			playField = document.createElement("canvas");
			playField.setAttribute("id", "snake-js");
			playField.setAttribute("width", config.gridWidth * config.pointSize);
			playField.setAttribute("height", config.gridHeight * config.pointSize + constants.SCOREBOARD_HEIGHT);
			parentElement.appendChild(playField);
			ctx = playField.getContext("2d");
			ctx.translate(0, constants.SCOREBOARD_HEIGHT);
		};

		this.drawSnake = function(snake, color){

			if (snake.points.length === 1) {
				var position = getPointPivotPosition(snake.points[0]);

				ctx.fillStyle = color;
				ctx.beginPath();
				ctx.arc(position.left, position.top, snakeThickness/2, 0, 2*Math.PI, false);
				ctx.fill();
			}
			else {
				ctx.strokeStyle = color;
				ctx.lineWidth = snakeThickness;
				ctx.lineJoin = "round";
				ctx.lineCap = "round";
				
				ctx.beginPath();
				
				for (var i = 0; i < snake.points.length; i++) {
	
					var currentPoint = snake.points[i];

					if (i === 0) {
						
						var currentPointPosition = getPointPivotPosition(currentPoint);
						
						ctx.moveTo(currentPointPosition.left, currentPointPosition.top);
					}
					
					else {
						var prevPoint = snake.points[i-1];
	
						if(Math.abs(prevPoint.left - currentPoint.left) <= 1 && Math.abs(prevPoint.top - currentPoint.top) <= 1){
							var currentPointPosition = getPointPivotPosition(currentPoint);
							ctx.lineTo(currentPointPosition.left, currentPointPosition.top);
						}
						else {
							connectWallPoints(prevPoint, currentPoint);
						}
					}
				}
				ctx.stroke();
			}

			drawEye(snake, snake.direction);
		};

		this.drawCandy = function(candy){

			ctx.fillStyle = candy.color;

			var position = getPointPivotPosition(candy.point);

			ctx.beginPath();

			ctx.arc(position.left, position.top, length(candy.radius), 0, Math.PI*2, false);
			ctx.fill();
		};

		this.clear = function(color) {
			ctx.fillStyle = color || backgroundColor;
			ctx.fillRect(0, 0,
					config.gridWidth * config.pointSize,
					config.gridHeight * config.pointSize);
		};

		this.drawScore = function(score, highScore){
			
			ctx.translate(0, -1 * constants.SCOREBOARD_HEIGHT);

			var bottomMargin = 5;
			var horizontalMargin = 4;

			ctx.fillStyle = config.scoreBoardColor;
			ctx.fillRect(0, 0, config.gridWidth * config.pointSize, constants.SCOREBOARD_HEIGHT);

			ctx.fillStyle = config.scoreTextColor;
			ctx.font = "bold 16px 'Courier new', monospace";

			ctx.textAlign = "right";
			ctx.fillText(score, config.gridWidth * config.pointSize - horizontalMargin, constants.SCOREBOARD_HEIGHT - bottomMargin);

			ctx.textAlign = "left";
			ctx.fillText(highScore, horizontalMargin, constants.SCOREBOARD_HEIGHT - bottomMargin);

			ctx.translate(0, constants.SCOREBOARD_HEIGHT);
		};

		var drawEye = function(snake) {
			var head = snake.points[0];
			var headPosition = getPointPivotPosition(head);

			var offsetLeft = length(0.125);
			var offsetTop = length(0.15);

			switch (snake.direction){
			case constants.DIRECTION_LEFT:
				headPosition.left -= offsetLeft;
				headPosition.top -= offsetTop;
				break;
			case constants.DIRECTION_RIGHT:
				headPosition.left += offsetLeft;
				headPosition.top -= offsetTop;
				break;
			case constants.DIRECTION_UP:
				headPosition.left -= offsetTop;
				headPosition.top -= offsetLeft;
				break;
			case constants.DIRECTION_DOWN:
				headPosition.left += offsetTop;
				headPosition.top += offsetLeft;
				break;
			}

			if (snake.alive) {
				ctx.beginPath();
				ctx.fillStyle = config.snakeEyeColor;
		
				ctx.arc(headPosition.left, headPosition.top, length(0.125), 0, Math.PI*2, false);
				ctx.fill();
			}
			else {
				ctx.beginPath();
				ctx.strokeStyle = config.snakeEyeColor;
				ctx.lineWidth = 2;
				ctx.moveTo(headPosition.left - length(0.1), headPosition.top - length(0.1));
				ctx.lineTo(headPosition.left + length(0.1), headPosition.top + length(0.1));
				ctx.moveTo(headPosition.left + length(0.1), headPosition.top - length(0.1));
				ctx.lineTo(headPosition.left - length(0.1), headPosition.top + length(0.1));
				ctx.stroke();
			}
		};

		var length = function(value){
			return value * config.pointSize;
		};

		var getPointPivotPosition = function(point) {
			var position = {
					left : point.left * length(1) + length(.5),
					top : point.top * length(1) + length(.5)
			};
			return position;
		};

		var connectWallPoints = function(p1, p2) {

			var p2Position = getPointPivotPosition(p2);

			var leftOffset = utilities.sign(p2.left - p1.left);
			
			var topOffset = utilities.sign(p2.top - p1.top);

			var fakeEndPoint = new Point(p1.left - leftOffset, p1.top - topOffset);
			
			var fakeEndPointPosition = getPointPivotPosition(fakeEndPoint);
			
			ctx.lineTo(fakeEndPointPosition.left, fakeEndPointPosition.top);

			var fakeStartPoint = new Point(p2.left + leftOffset, p2.top + topOffset);
			var fakeStartPointPosition = getPointPivotPosition(fakeStartPoint);
			
			ctx.moveTo(fakeStartPointPosition.left, fakeStartPointPosition.top);
			
			ctx.lineTo(p2Position.left, p2Position.top);
		};
	}

	function InputInterface(pauseFn, resumeFn, autoPlayFn){

		var arrowKeys = [37, 38, 39, 40],	
			listening = false,				
			lastDirection = null;			

		this.lastDirection = function(){
			return lastDirection;
		};

		this.startListening = function(){
			if (!listening) {
				window.addEventListener("keydown", handleKeyDown, true);
				window.addEventListener("keypress", disableKeyPress, true);
				window.addEventListener("pause", pauseFn, true);
				window.addEventListener("resume", resumeFn, true);
				listening = true;
			}
		};

		this.stopListening = function(){
			if (listening) {
				window.removeEventListener("keydown", handleKeyDown, true);
				window.removeEventListener("keypress", disableKeyPress, true);
				window.removeEventListener("pause", pauseFn, true);
				window.removeEventListener("resume", resumeFn, true);
				listening = false;
			}
		};

		var handleKeyDown = function(event){
			if (arrowKeys.indexOf(event.keyCode) >= 0) {
				handleArrowKeyPress(event);
			}
		};

		var disableKeyPress = function(event){
			if (arrowKeys.indexOf(event.keyCode) >= 0) {
				event.preventDefault();
			}
		};

		var handleArrowKeyPress = function(event){
			with (constants) {
				switch (event.keyCode) {
				case 37:
					lastDirection = DIRECTION_LEFT;
					break;
				case 38:
					lastDirection = DIRECTION_UP;
					break;
				case 39:
					lastDirection = DIRECTION_RIGHT;
					break;
				case 40:
					lastDirection = DIRECTION_DOWN;
					break;
				}
			}
			event.preventDefault();
	
			autoPlayFn();
		};
	}

	if (config.autoInit) {
		this.init();
	}
};
